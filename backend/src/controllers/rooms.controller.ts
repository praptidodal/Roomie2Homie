import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import { Room, IRoom } from '../models/Room';
import { AppError } from '../middlewares/error.middleware';
import { toRoomDTO } from '../utils/dto';

const VALID_CITIES = [
  'Bengaluru',
  'Mumbai',
  'Pune',
  'Hyderabad',
  'Delhi NCR',
  'Chennai',
  'Ahmedabad',
  'Kolkata',
] as const;

type CityType = typeof VALID_CITIES[number];

const VALID_TYPES = ['private_room', 'shared_room', 'studio', 'full_flat'] as const;
type RoomType = typeof VALID_TYPES[number];

const VALID_FURNISHING = ['furnished', 'semi_furnished', 'unfurnished'] as const;
type FurnishingType = typeof VALID_FURNISHING[number];

const VALID_GENDER = ['any', 'female', 'male'] as const;
type GenderPreference = typeof VALID_GENDER[number];

/**
 * GET /api/rooms
 * List active room listings with optional query filters:
 *   city          — exact match from VALID_CITIES
 *   type          — private_room | shared_room | studio | full_flat
 *   furnishing    — furnished | semi_furnished | unfurnished
 *   maxRent       — maximum rent (number)
 *   verifiedOnly  — 'true' to restrict to isVerified === true
 *   limit         — max results (default 50, max 100)
 *
 * Protected: requires authenticate middleware.
 */
export async function listRooms(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { city, type, furnishing, maxRent, verifiedOnly, limit } = req.query;

    // Build Mongoose filter
    const filter: Record<string, unknown> = { isActive: true };

    if (city && typeof city === 'string' && (VALID_CITIES as readonly string[]).includes(city)) {
      filter.city = city;
    }

    if (type && typeof type === 'string' && (VALID_TYPES as readonly string[]).includes(type)) {
      filter.type = type;
    }

    if (furnishing && typeof furnishing === 'string' && (VALID_FURNISHING as readonly string[]).includes(furnishing)) {
      filter.furnishing = furnishing;
    }

    if (maxRent) {
      const maxRentNum = Number(maxRent);
      if (!isNaN(maxRentNum) && maxRentNum > 0) {
        filter.rent = { $lte: maxRentNum };
      }
    }

    if (verifiedOnly === 'true') {
      filter.isVerified = true;
    }

    const limitNum = Math.min(Number(limit) || 50, 100);

    const rooms = await Room.find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: rooms.map((r) => toRoomDTO(r as unknown as IRoom)),
      count: rooms.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/rooms/mine
 * List rooms owned by the authenticated user (any isActive state).
 * Protected: requires authenticate middleware.
 * The hostId is taken from req.user._id set by the authenticate middleware —
 * the frontend cannot supply an arbitrary host ID.
 */
export async function listMyRooms(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    const hostId = req.user._id;

    const rooms = await Room.find({ hostId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: rooms.map((r) => toRoomDTO(r as unknown as IRoom)),
      count: rooms.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/rooms/:id
 * Fetch full room detail by MongoDB ObjectId.
 * Protected: requires authenticate middleware.
 */
export async function getRoomById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(new AppError('Invalid room ID.', 400));
    }

    const room = await Room.findOne({ _id: id, isActive: true }).lean();

    if (!room) {
      return next(new AppError('Room listing not found or no longer active.', 404));
    }

    res.status(200).json({
      success: true,
      data: toRoomDTO(room as unknown as IRoom),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/rooms
 * Create a new room listing.
 * Protected: requires authenticate middleware.
 *
 * Security:
 *  - hostId is ALWAYS taken from req.user._id (set by authenticate middleware).
 *  - Frontend-supplied hostId, isVerified, isActive, _id, and timestamps are
 *    silently ignored even if submitted.
 *  - isVerified defaults to false (admin approval required separately).
 *  - isActive defaults to true.
 *
 * Returns 201 with the newly created room DTO on success.
 * Returns 400 with validation errors.
 */
export async function createRoom(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    const hostId = req.user._id;

    // Destructure only user-settable fields. hostId, isVerified, isActive,
    // _id, createdAt, and updatedAt are NOT taken from req.body.
    const {
      title,
      city,
      locality,
      rent,
      deposit,
      type,
      furnishing,
      availableFrom,
      images,
      amenities,
      flatmates,
      preferredGender,
      description,
      houseRules,
      bills,
    } = req.body as Record<string, unknown>;

    // ── Manual pre-validation ──

    if (!title || typeof title !== 'string' || title.trim().length < 5) {
      return next(new AppError('Title must be at least 5 characters.', 400));
    }
    if ((title as string).trim().length > 100) {
      return next(new AppError('Title must be at most 100 characters.', 400));
    }
    if (!city || !(VALID_CITIES as readonly string[]).includes(city as string)) {
      return next(new AppError(`City must be one of: ${VALID_CITIES.join(', ')}.`, 400));
    }
    if (!locality || typeof locality !== 'string' || locality.trim().length === 0) {
      return next(new AppError('Locality is required.', 400));
    }
    if ((locality as string).trim().length > 60) {
      return next(new AppError('Locality must be at most 60 characters.', 400));
    }
    const rentNum = Number(rent);
    if (!rent || isNaN(rentNum) || rentNum < 2000 || rentNum > 200000) {
      return next(new AppError('Rent must be between ₹2,000 and ₹2,00,000.', 400));
    }
    const depositNum = Number(deposit);
    if (deposit === undefined || isNaN(depositNum) || depositNum < 0 || depositNum > 1000000) {
      return next(new AppError('Deposit must be between ₹0 and ₹10,00,000.', 400));
    }
    if (!type || !(VALID_TYPES as readonly string[]).includes(type as string)) {
      return next(new AppError(`Room type must be one of: ${VALID_TYPES.join(', ')}.`, 400));
    }
    if (!furnishing || !(VALID_FURNISHING as readonly string[]).includes(furnishing as string)) {
      return next(new AppError(`Furnishing must be one of: ${VALID_FURNISHING.join(', ')}.`, 400));
    }
    if (!description || typeof description !== 'string' || description.trim().length < 20) {
      return next(new AppError('Description must be at least 20 characters.', 400));
    }
    if ((description as string).trim().length > 1200) {
      return next(new AppError('Description must be at most 1200 characters.', 400));
    }
    // ── Parse multipart or JSON fields ──
    const uploadedFiles = req.files as Express.Multer.File[] | undefined;
    const uploadedImageUrls: string[] = [];
    if (uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        uploadedImageUrls.push(`/uploads/rooms/${file.filename}`);
      }
    }

    // Safely parse amenities if passed as JSON string or array
    let parsedAmenities: string[] = [];
    if (typeof amenities === 'string') {
      try {
        const parsed = JSON.parse(amenities);
        if (Array.isArray(parsed)) parsedAmenities = parsed;
        else parsedAmenities = [amenities];
      } catch {
        parsedAmenities = amenities.split(',').map((s) => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(amenities)) {
      parsedAmenities = amenities.filter((a): a is string => typeof a === 'string');
    }

    // Safely parse houseRules if passed as JSON string or array
    let parsedHouseRules: string[] = [];
    if (typeof houseRules === 'string') {
      try {
        const parsed = JSON.parse(houseRules);
        if (Array.isArray(parsed)) parsedHouseRules = parsed;
        else parsedHouseRules = [houseRules];
      } catch {
        parsedHouseRules = houseRules.split(',').map((s) => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(houseRules)) {
      parsedHouseRules = houseRules.filter((r): r is string => typeof r === 'string');
    }

    // Safely parse bills if passed as JSON string
    let billsObj: Record<string, unknown> = {};
    if (typeof bills === 'string') {
      try {
        billsObj = JSON.parse(bills);
      } catch {
        billsObj = {};
      }
    } else if (bills && typeof bills === 'object' && !Array.isArray(bills)) {
      billsObj = bills as Record<string, unknown>;
    }

    // Safely parse images if passed in body
    let bodyImages: string[] = [];
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) bodyImages = parsed;
        else if (images.trim()) bodyImages = [images.trim()];
      } catch {
        if (images.trim()) bodyImages = [images.trim()];
      }
    } else if (Array.isArray(images)) {
      bodyImages = images.filter((img): img is string => typeof img === 'string');
    }

    // Combine uploaded files + any body images
    const finalImages = [...uploadedImageUrls, ...bodyImages]
      .map((img) => String(img).trim())
      .filter((img) => img.length > 0);

    if (finalImages.length > 10) {
      return next(new AppError('A listing can have at most 10 images.', 400));
    }
    if (parsedHouseRules.length > 10) {
      return next(new AppError('A listing can specify up to 10 house rules.', 400));
    }
    const flatmatesNum = flatmates !== undefined ? Number(flatmates) : 1;
    if (isNaN(flatmatesNum) || flatmatesNum < 0 || flatmatesNum > 10) {
      return next(new AppError('Flatmates must be between 0 and 10.', 400));
    }

    let availableFromDate: Date;
    try {
      availableFromDate = availableFrom ? new Date(availableFrom as string) : new Date();
      if (isNaN(availableFromDate.getTime())) throw new Error();
    } catch {
      return next(new AppError('availableFrom must be a valid date string.', 400));
    }

    // Sanitise bills — only accept recognised numeric sub-fields
    const sanitisedBills = {
      rent: Number(billsObj.rent) || rentNum,
      maintenance: Number(billsObj.maintenance) || 0,
      internet: Number(billsObj.internet) || 0,
      electricity: Number(billsObj.electricity) || 0,
    };

    const room = await Room.create({
      hostId,              // from authenticate middleware — never from body
      title: (title as string).trim(),
      city: city as CityType,
      locality: (locality as string).trim(),
      rent: rentNum,
      deposit: depositNum,
      type: type as RoomType,
      furnishing: furnishing as FurnishingType,
      availableFrom: availableFromDate,
      images: finalImages,
      amenities: parsedAmenities.map((a) => a.trim()),
      flatmates: flatmatesNum,
      preferredGender: (VALID_GENDER as readonly string[]).includes(preferredGender as string)
        ? (preferredGender as GenderPreference)
        : 'any',
      description: (description as string).trim(),
      houseRules: parsedHouseRules.map((r) => r.trim()),
      bills: sanitisedBills,
      isVerified: false,   // always false on creation — admin approves separately
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Room listing created successfully.',
      data: toRoomDTO(room),
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((e: any) => e.message)
        .join('; ');
      return next(new AppError(`Validation failed: ${message}`, 400));
    }
    next(error);
  }
}

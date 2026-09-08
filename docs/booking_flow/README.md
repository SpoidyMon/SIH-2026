# End-to-End Mandi Arrival Slot Booking & Digital Pass Flow

## Architecture Overview

The booking flow connects four layers:
1. **Shared Database (`packages/database`)**:
   - `MandiProfile`: `mandiCode` (`MAN001`, `MAN002`), `pincode`, `closedDays`, `closedHours`, `isLocationSet`.
   - `MandiSlot`: `allowedCrops` JSON field supporting multi-crop intake specifications with fixed or flexible/unspecified limits.
   - `Booking`: `queueNumber` (1-indexed sequential queue order), `qrCodeData`, `servedAt`.

2. **Backend API (`apps/backend`)**:
   - Sequential Mandi Code Generator: Automatically creates formatted unique sequential IDs (`MAN001`, `MAN002`...).
   - `POST /api/v1/mandi/location`: Sets physical yard address, pincode, GPS coordinates, closed days, and closed hours; sets `isLocationSet = true`.
   - `GET /api/v1/farmer/mandis`: Filters mandis so only approved mandis with marked yard coordinates and addresses (`isLocationSet === true`) appear on the farmer app.
   - `POST /api/v1/farmer/bookings`: Generates token formatted as `<DAY><MONTH>-<TIME>-<SEQ>` (e.g. `8SEP-10AM-001`), computes queue position, and stores QR code payload.
   - `POST /api/v1/mandi/gate/verify-token`: Verifies tokens and checks First-Come First-Served queue order; triggers warning if out of sequence.
   - `GET /api/v1/mandi/farmers/:farmerId/details`: Returns full KYC profile, ID proof, land size, and crops for instant inspector lookup.

3. **Mandi Desktop Cockpit (`apps/frontend`)**:
   - **Mandi Identification**: Sequential Mandi Code (`MAN001`) displayed prominently.
   - **Yard Coordinate Markup & Map**: OpenStreetMap visual pin marker and browser geolocation fetch button.
   - **Operational Calendar**: Weekly closed days and night hours setting.
   - **Multi-Crop Slot Configurator**: Supports defining multiple intake crops (e.g. Tomato: 100kg, Onion: flexible) and farmer capacity limit (e.g. 7).
   - **Bookings Tab & Dashboard (`MandiBookingsView`)**: Live queue order (`001`, `002`...), search, status filter, pass visualizer, and weight settlement.
   - **Gate Scanner (`MandiGateScannerView`)**: Warns operator when token scanned is out of order and provides instant farmer KYC modal.

4. **Farmer Mobile Application (`apps/application/farmer-setu`)**:
   - **Mandi Discovery**: Displays eligible mandis with APMC Mandi code badges.
   - **Slot Booking Modal (`SlotBookingModal`)**: Interactive slot window, produce commodity selector, quantity calculator (Quintals to KG), and vehicle input.
   - **Digital Gate Pass**: Displays token (`8SEP-10AM-001`), Queue badge (`Q#001`), and live QR code image.
   - **Bookings Tab (`BookingsSectionView`)**: Displays active and past tokens, queue positions, and quick QR pass modal.

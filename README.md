# Photobooth MERN123 Application

This is a full-featured photobooth application built with Next.js, React, and several other modern technologies to create a seamless photobooth experience.

## Key Features

- Multi-frame photo layouts
- Photo filters and effects
- Video and GIF creation
- QR code sharing
- Printing capabilities
- Store customization
- Session management

## Recent Optimizations

The application has been optimized to improve the user experience with the following key improvements:

### Performance Optimization in Step8 and Step9

1. **Parallel Processing**
   - Image generation, printing, and media upload now happen in parallel
   - Video and GIF generation run in the background while users proceed to the QR code step
   - Reduced waiting time between steps

2. **Image Processing Improvements**
   - Optimized image preloading with better error handling
   - Reduced scale factor for faster HTML2Canvas rendering while maintaining quality
   - Parallel processing of QR code generation and image preparation

3. **Memory and Resource Management**
   - Better cleanup of resources to prevent memory leaks
   - Improved error handling to prevent process blockages
   - Optimized canvas rendering for better performance

4. **Enhanced User Experience**
   - Step9 now shows processing status for all media types
   - QR code is generated and displayed faster
   - Users can see real-time status of background processes

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM
- **Media Processing**: HTML2Canvas, GIF.js
- **Deployment**: Docker support

## Setup and Development

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables (see `.env.example`)

3. Run development server:
   ```
   npm run dev
   ```

4. For production build:
   ```
   npm run build
   npm start
   ```

## Docker Deployment

The application can be deployed using Docker with the provided Dockerfile and docker-compose.yml files.

```
docker-compose up -d
```

## License

This project is proprietary software. All rights reserved.

## Support

For any issues or questions, please refer to the documentation or contact the development team.
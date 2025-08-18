# <img height="25" src="public/edix/edix.png"> Edix — AI-Powered Image Editor

**Edit. Enhance. Express.**  
Edix is a professional-grade, AI-powered image editing platform built with Next.js. Designed for creators, developers, marketers, and everyday users who demand powerful editing capabilities with intuitive design. Transform your images with cutting-edge AI tools, advanced editing features, and seamless cloud integration — all from your browser.

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15.4.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.12.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Fabric.js](https://img.shields.io/badge/Fabric.js-6.7.1-FF6B6B?style=for-the-badge&logo=javascript)](http://fabricjs.com/)

</div>

---

## ✨ Features

### 🎨 **Core Editing Tools**
- ✂️ **Precision Editing**: Advanced crop, rotate, flip, and resize with pixel-perfect accuracy
- 🎨 **Color Mastery**: Professional-grade brightness, contrast, saturation, hue, and exposure controls
- 🖋️ **Creative Overlays**: Rich text editing, custom stickers, freehand drawing with brush controls
- 📐 **Transform Tools**: Scale, skew, perspective correction, and geometric transformations
- 🔄 **Non-destructive Editing**: Maintain original quality with layer-based editing

### 🧠 **AI-Powered Features**
- 🌟 **Smart Background Removal**: One-click AI background removal with edge refinement
- 🔍 **AI Image Upscaler**: Enhance resolution up to 4x with AI super-resolution
- 🎭 **AI Retouch & Restore**: Automatic blemish removal, noise reduction, and photo restoration
- 🖼️ **AI Image Extender**: Intelligently expand image boundaries with contextual generation
- 🎨 **Smart Filters**: AI-curated filter suggestions based on image content
- � **Auto-Enhancement**: One-click intelligent color correction and optimization

### 💼 **Professional Workflow**
- 📁 **Project Management**: Organize projects in folders with hierarchical structure
- 💾 **Cloud Storage**: Secure image storage with ImageKit integration
- 📤 **Multi-format Export**: Export in PNG, JPG, WebP, SVG formats with quality control
- 📱 **Cross-platform**: Responsive design optimized for desktop, tablet, and mobile
- ⚡ **Real-time Preview**: Instant preview of edits with hardware acceleration

### 🔐 **User Management & Security**
- 👤 **Authentication**: Secure user authentication with Clerk
- 👥 **User Profiles**: Personalized workspace with usage analytics
- � **Data Security**: End-to-end encryption for uploaded images
- 📊 **Usage Tracking**: Monitor projects, exports, and subscription limits

---

## 💎 Subscription Plans

### 🆓 **Free Plan**
Perfect for casual users and trying out Edix

- ✅ **3 projects maximum**
- ✅ **20 exports per month**
- ✅ **Basic editing tools** (crop, resize, rotate)
- ✅ **Color adjustments** (brightness, contrast, saturation)
- ✅ **Text overlays** with basic fonts
- ✅ **Standard export quality**
- ✅ **Community support**

### 🚀 **Pro Plan - $10/month**
*Save 15% with annual billing ($8.50/month)*

Unleash the full power of AI-driven image editing

- ✅ **Unlimited projects**
- ✅ **Unlimited exports**
- ✅ **All editing tools** (advanced transforms, filters, effects)
- ✅ **AI Background Remover** with edge refinement
- ✅ **AI Image Extender** for seamless expansion
- ✅ **AI Upscaler** up to 4x resolution enhancement
- ✅ **AI Retouch & Restore** tools
- ✅ **Premium filters** and presets
- ✅ **Priority cloud storage** (10GB)
- ✅ **High-resolution exports** (up to 8K)
- ✅ **Priority support** with 24/7 assistance
- ✅ **Early access** to beta features

---

## 🛠️ Tech Stack

### **Frontend Framework**
- **[Next.js 15.4.4](https://nextjs.org/)** – React framework with App Router, SSR, and edge functions
- **[React 19.1.0](https://reactjs.org/)** – Component-based UI library with latest features
- **[TypeScript 5.0](https://www.typescriptlang.org/)** – Type-safe development with advanced tooling

### **Styling & UI**
- **[Tailwind CSS 4.0](https://tailwindcss.com/)** – Utility-first CSS framework with modern design system
- **[Radix UI](https://www.radix-ui.com/)** – Headless UI components for accessibility and customization
- **[Lucide React](https://lucide.dev/)** – Beautiful, customizable SVG icons
- **[Next Themes](https://github.com/pacocoursey/next-themes)** – Dark/light theme support

### **Canvas & Image Processing**
- **[Fabric.js 6.7.1](http://fabricjs.com/)** – Powerful HTML5 canvas library for interactive graphics
- **[React Colorful](https://omgovich.github.io/react-colorful/)** – Lightweight color picker component
- **[React Dropzone](https://react-dropzone.js.org/)** – Flexible file upload with drag & drop

### **Backend & Database**
- **[Prisma 6.12.0](https://www.prisma.io/)** – Type-safe database ORM with PostgreSQL
- **[PostgreSQL](https://www.postgresql.org/)** – Robust relational database for production
- **[ImageKit](https://imagekit.io/)** – Cloud-based image optimization and CDN

### **Authentication & Security**
- **[Clerk](https://clerk.com/)** – Complete authentication and user management
- **[Clerk Themes](https://clerk.com/docs/components/customization/themes)** – Customizable auth UI components

### **Development Tools**
- **[ESLint](https://eslint.org/)** – Code linting with Next.js configuration
- **[Date-fns](https://date-fns.org/)** – Modern date utility library
- **[Axios](https://axios-http.com/)** – HTTP client for API requests
- **[Sonner](https://sonner.emilkowal.ski/)** – Beautiful toast notifications
- **[React Spinners](https://www.davidhu.io/react-spinners/)** – Loading indicators

---

## 📦 Installation & Setup

### **Prerequisites**
- Node.js 18.0 or later
- npm or yarn package manager
- PostgreSQL database
- ImageKit account (for image storage)
- Clerk account (for authentication)

### **Quick Start**

```bash
# Clone the repository
git clone https://github.com/adityakashyap5047/Edix.git
cd edix

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your environment variables (see Configuration section)

# Set up the database
npx prisma generate
npx prisma db push

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### **Configuration**

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/edix"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# ImageKit
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
IMAGEKIT_TOKEN=your_imagekit_token

# Unsplash
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

---

## 📁 Project Structure

```
edix/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   │   ├── sign-in/       # Sign in page
│   │   │   └── sign-up/       # Sign up page
│   │   ├── (main)/            # Main application
│   │   │   ├── dashboard/     # User dashboard
│   │   │   └── editor/        # Image editor
│   │   ├── api/               # API routes
│   │   │   ├── imagekit/      # ImageKit integration
│   │   │   ├── projects/      # Project management
│   │   │   └── users/         # User operations
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # Reusable components
│   │   ├── Home/              # Landing page components
│   │   └── ui/                # UI component library
│   ├── context/               # React contexts
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
├── components.json            # Shadcn/ui configuration
├── next.config.ts             # Next.js configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```



## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### **Ways to Contribute**
- 🐛 **Bug Reports**: Report issues with detailed reproduction steps
- 💡 **Feature Requests**: Suggest new features or improvements
- 🔧 **Code Contributions**: Submit pull requests for bug fixes or features
- 📚 **Documentation**: Improve documentation and tutorials
- 🎨 **Design**: Contribute UI/UX improvements

### **Development Workflow**

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper commit messages
4. **Add tests** for new functionality
5. **Ensure all tests pass**: `npm test`
6. **Submit a pull request** with detailed description

### **Code Standards**
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Add JSDoc comments for complex functions
- Ensure accessibility compliance

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**What this means:**
- Commercial use allowed
- Modification allowed
- Distribution allowed
- Private use allowed
- No warranty provided
- No liability accepted

---

## 🙌 Acknowledgments

Special thanks to the amazing open-source community and these fantastic projects:

- **[Fabric.js](http://fabricjs.com/)** - For powerful canvas manipulation
- **[Next.js](https://nextjs.org/)** - For the incredible React framework
- **[Tailwind CSS](https://tailwindcss.com/)** - For beautiful, utility-first styling
- **[Prisma](https://www.prisma.io/)** - For type-safe database operations
- **[Clerk](https://clerk.com/)** - For seamless authentication
- **[Vercel](https://vercel.com/)** - For effortless deployment and hosting

---

## 🧑‍💻 Author

**Aditya Kashyap**
- 🌐 Website: [Coming Soon]
- 📧 Email: [Your Email]
- 🐙 GitHub: [@adityakashyap5047](https://github.com/adityakashyap5047)
- 💼 LinkedIn: [Your LinkedIn]

---

## 📞 Support & Community

- 📧 **Email Support**: support@edix.com
- 💬 **Discord Community**: [Join our Discord](https://discord.gg/edix)
- 📖 **Documentation**: [docs.edix.com](https://docs.edix.com)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/adityakashyap5047/Edix/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/adityakashyap5047/Edix/discussions)

---

<div align="center">

**Made with ❤️ and lots of ☕ by the Edix Team**

[⭐ Star this repo](https://github.com/adityakashyap5047/Edix) • [🐛 Report Bug](https://github.com/adityakashyap5047/Edix/issues) • [� Request Feature](https://github.com/adityakashyap5047/Edix/discussions)

</div>
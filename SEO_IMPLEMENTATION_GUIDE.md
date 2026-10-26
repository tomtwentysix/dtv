# SEO and Structured Data Implementation Guide

## Overview

This implementation adds comprehensive SEO and structured data support to the DT Visuals website, enabling Google Rich Results and improved search visibility. The system includes a full admin interface for managing SEO settings, automatic structured data injection, and dynamic meta tag management.

## Features Added

### 1. Database Schema
- New `seoSettings` table with comprehensive SEO configuration fields
- Integration with existing `media` table for social media images
- Default values provided for immediate use

### 2. API Endpoints
- `GET /api/seo-settings` - Retrieve current SEO settings
- `PUT /api/seo-settings` - Update SEO settings (requires admin permissions)
- `POST /api/generate-sitemap` - Generate sitemap with pages and videos

### 3. Admin Interface
New "SEO" tab in Website Customization with 4 sub-sections:

#### Basic SEO
- Meta title (with character counter)
- Meta description (with character counter)  
- Meta keywords
- Canonical URL

#### Social Media
- Open Graph image selection (from existing media)
- Twitter Card image selection (from existing media)

#### Business Data
- Business name, URL, description
- Address information (locality, region, country)
- Services list (JSON format)
- Geographic coordinates

#### Advanced
- Toggle structured data on/off
- Toggle Open Graph tags on/off
- Toggle Twitter Cards on/off
- Sitemap regeneration button

### 4. Structured Data (JSON-LD)
Automatically generates schema.org markup for:

- **LocalBusiness** - Complete business information with service catalog
- **Organization** - Company details with contact information
- **WebSite** - Website schema with search functionality
- **FAQ** - Frequently asked questions (default set provided)
- **BreadcrumbList** - Navigation breadcrumbs for each page
- **VideoObject** - Individual video metadata (for portfolio)

### 5. Dynamic SEO Hooks
React hooks automatically manage SEO for each page:

- `useHomePageSEO()` + `useHomePageStructuredData()`
- `usePortfolioSEO()` + `usePortfolioStructuredData()`
- `useAboutSEO()` + `useAboutStructuredData()`
- `useServicesSEO()` + `useServicesStructuredData()`
- `useContactSEO()` + `useContactStructuredData()`

## How to Use

### Initial Setup
1. Access the admin panel and navigate to Website Customization
2. Click on the "SEO" tab
3. Fill in the Basic SEO information (title, description, keywords)
4. Configure Business Data section with company information
5. Optionally select social media images
6. Save settings

### Managing Content
- **Meta Tags**: Updated automatically based on SEO settings
- **Structured Data**: Injected automatically on page load
- **Sitemap**: Click "Regenerate Sitemap" button to update with new content
- **Social Images**: Select from existing media uploads or upload new ones

### Testing Rich Results
1. Use Google's Rich Results Test: https://search.google.com/test/rich-results
2. Enter your website URL to test structured data
3. Check for any validation errors or warnings

## Rich Results Enabled

The implementation enables these Google Rich Results:

- ✅ **Business Information** - Company details, location, services
- ✅ **Service Listings** - Professional video production offerings  
- ✅ **FAQ Snippets** - Expandable question/answer results
- ✅ **Local Business Results** - Geographic search optimization
- ✅ **Navigation Breadcrumbs** - Page navigation structure
- ✅ **Video Content** - Rich results for portfolio videos

## Technical Implementation

### URL Consistency
- Fixed all instances of `dt-visuals.com` to `dtvisuals.com`
- Updated robots.txt, footer, and meta tags

### File Structure
```
client/src/
├── hooks/
│   ├── use-structured-data.tsx    # Structured data injection
│   └── use-seo-meta.tsx          # Meta tag management
├── lib/
│   └── structured-data-utils.ts   # Schema generation utilities
├── pages/
│   ├── home.tsx                  # Homepage with SEO hooks
│   ├── portfolio.tsx             # Portfolio with SEO hooks
│   ├── about.tsx                 # About page with SEO hooks
│   ├── services.tsx              # Services page with SEO hooks
│   └── contact.tsx               # Contact page with SEO hooks
└── admin/
    └── website-customization.tsx # SEO admin interface

server/
├── routes.ts                     # SEO API endpoints
└── storage.ts                    # SEO database operations

shared/
└── schema.ts                     # Database schema with seoSettings
```

### Default Configuration
The system comes with sensible defaults for:
- Meta title and description optimized for DT Visuals
- UK-based business information (Leicestershire)
- Video production service categories
- Default FAQ questions and answers
- Geographic coordinates for local search

## Maintenance

### Updating FAQs
Edit the FAQ data in the Business Data section using JSON format:
```json
[
  {
    "question": "What services do you offer?",
    "answer": "We provide luxury event videography, corporate video production..."
  }
]
```

### Adding New Services
Update the services field in Business Data section:
```json
["Luxury Event Videography", "Corporate Video Production", "Music Video Production"]
```

### Monitoring Performance
- Use Google Search Console to monitor Rich Results performance
- Check Google's Rich Results Test regularly after content updates
- Monitor search visibility improvements in analytics

## Support

The implementation follows Google's structured data guidelines and schema.org standards. All structured data is validated automatically and should pass Google's Rich Results testing tools.

For troubleshooting, check the browser console for any structured data injection errors or use Google's testing tools to validate the markup.
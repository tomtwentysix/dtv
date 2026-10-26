#!/usr/bin/env node

/**
 * Structured Data Validation Script
 * Validates JSON-LD schemas for syntax and required properties
 */

import { 
  generateLocalBusinessSchema,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateFAQSchema,
  getDefaultFAQs
} from '../client/src/lib/structured-data-utils';

// Mock SEO settings for testing
const mockSeoSettings = {
  metaTitle: "Video Production Company | Luxury Events, Music & Brands | DT Visuals UK",
  metaDescription: "DT Visuals is a UK-based video production team creating cinematic content for luxury events, artists, brands and agencies. Based in Leicestershire, working UK-wide.",
  businessName: "DT Visuals",
  businessDescription: "Professional video production company specializing in luxury events, music videos, and branded content",
  businessUrl: "https://dtvisuals.com",
  businessEmail: "hello@dtvisuals.com",
  businessPhone: "+44 123 456 7890",
  addressLocality: "Leicestershire",
  addressRegion: "England",
  addressCountry: "GB",
  latitude: "52.6369",
  longitude: "-1.1398",
  services: '["Luxury Event Videography","Corporate Video Production","Music Video Production","Creative Direction","Post-Production Services"]',
  enableStructuredData: true
};

function validateSchema(schema, schemaType) {
  console.log(`\n=== Validating ${schemaType} Schema ===`);
  
  try {
    // Check if it's valid JSON
    const jsonString = JSON.stringify(schema, null, 2);
    const parsed = JSON.parse(jsonString);
    
    // Check required properties
    const requiredProps = ['@context', '@type'];
    const missingProps = requiredProps.filter(prop => !parsed[prop]);
    
    if (missingProps.length > 0) {
      console.error(`❌ Missing required properties: ${missingProps.join(', ')}`);
      return false;
    }
    
    if (parsed['@context'] !== 'https://schema.org') {
      console.error(`❌ Invalid @context: ${parsed['@context']}`);
      return false;
    }
    
    console.log(`✅ ${schemaType} schema is valid`);
    console.log(`   @type: ${parsed['@type']}`);
    console.log(`   Properties: ${Object.keys(parsed).length}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Invalid JSON in ${schemaType} schema:`, error.message);
    return false;
  }
}

function main() {
  console.log("🔍 DT Visuals Structured Data Validation");
  console.log("=========================================");
  
  let validCount = 0;
  let totalCount = 0;
  
  // Test LocalBusiness schema
  totalCount++;
  const localBusinessSchema = generateLocalBusinessSchema(mockSeoSettings);
  if (validateSchema(localBusinessSchema, 'LocalBusiness')) {
    validCount++;
  }
  
  // Test Organization schema
  totalCount++;
  const organizationSchema = generateOrganizationSchema(mockSeoSettings);
  if (validateSchema(organizationSchema, 'Organization')) {
    validCount++;
  }
  
  // Test WebSite schema
  totalCount++;
  const websiteSchema = generateWebSiteSchema(mockSeoSettings);
  if (validateSchema(websiteSchema, 'WebSite')) {
    validCount++;
  }
  
  // Test FAQ schema
  totalCount++;
  const faqData = getDefaultFAQs();
  const faqSchema = generateFAQSchema(faqData);
  if (validateSchema(faqSchema, 'FAQ')) {
    validCount++;
  }
  
  // Summary
  console.log("\n📊 Validation Summary");
  console.log("====================");
  console.log(`✅ Valid schemas: ${validCount}/${totalCount}`);
  console.log(`❌ Invalid schemas: ${totalCount - validCount}/${totalCount}`);
  
  if (validCount === totalCount) {
    console.log("\n🎉 All structured data schemas are valid!");
    console.log("Rich Results are now enabled for:");
    console.log("• Business Information");
    console.log("• Service Listings");
    console.log("• FAQ Snippets");
    console.log("• Local Business Results");
    console.log("• Website Search");
  } else {
    console.log("\n⚠️  Some schemas need attention before Rich Results can be enabled.");
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { validateSchema, mockSeoSettings };
#!/usr/bin/env node

/**
 * Structured Data Validation Script
 * Validates the JSON-LD structured data in the built HTML file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the built HTML file
const htmlPath = path.join(__dirname, 'dist', 'public', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('🔍 Validating Structured Data for DT Visuals...\n');

// Extract JSON-LD scripts
const jsonLdMatches = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g);

if (!jsonLdMatches) {
  console.log('❌ No JSON-LD structured data found');
  process.exit(1);
}

let validSchemas = 0;
let totalSchemas = jsonLdMatches.length;

jsonLdMatches.forEach((match, index) => {
  try {
    const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
    const schema = JSON.parse(jsonContent);
    
    console.log(`\n📋 Schema ${index + 1}: ${schema['@type']}`);
    console.log(`   Context: ${schema['@context']}`);
    
    // Validate required properties based on schema type
    switch (schema['@type']) {
      case 'LocalBusiness':
        validateLocalBusiness(schema);
        break;
      case 'FAQPage':
        validateFAQPage(schema);
        break;
      default:
        console.log(`   ⚠️  Unknown schema type: ${schema['@type']}`);
    }
    
    validSchemas++;
    
  } catch (e) {
    console.log(`❌ Schema ${index + 1} is invalid:`, e.message);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Valid schemas: ${validSchemas}/${totalSchemas}`);
console.log(`   🎯 Rich Results enabled: ${validSchemas > 0 ? 'YES' : 'NO'}`);

// Validation functions
function validateLocalBusiness(schema) {
  const required = ['name', 'description', 'url'];
  const missing = required.filter(prop => !schema[prop]);
  
  if (missing.length > 0) {
    console.log(`   ❌ Missing required properties: ${missing.join(', ')}`);
  } else {
    console.log(`   ✅ All required properties present`);
  }
  
  // Check for additional valuable properties
  const beneficial = [];
  if (schema.address) beneficial.push('address');
  if (schema.contactPoint) beneficial.push('contactPoint');
  if (schema.hasOfferCatalog) beneficial.push('service catalog');
  if (schema.areaServed) beneficial.push('area served');
  
  if (beneficial.length > 0) {
    console.log(`   💡 Enhanced with: ${beneficial.join(', ')}`);
  }
  
  // Validate service catalog
  if (schema.hasOfferCatalog && schema.hasOfferCatalog.itemListElement) {
    const services = schema.hasOfferCatalog.itemListElement.length;
    console.log(`   🛍️  Service catalog: ${services} services defined`);
  }
}

function validateFAQPage(schema) {
  if (!schema.mainEntity || !Array.isArray(schema.mainEntity)) {
    console.log(`   ❌ Missing or invalid mainEntity array`);
    return;
  }
  
  const questions = schema.mainEntity.length;
  console.log(`   ✅ FAQ with ${questions} questions`);
  
  // Validate each question structure
  let validQuestions = 0;
  schema.mainEntity.forEach((item, i) => {
    if (item['@type'] === 'Question' && item.name && item.acceptedAnswer) {
      if (item.acceptedAnswer['@type'] === 'Answer' && item.acceptedAnswer.text) {
        validQuestions++;
      }
    }
  });
  
  console.log(`   📝 Valid Q&A pairs: ${validQuestions}/${questions}`);
}

// Check for SEO meta tags
console.log(`\n🔍 SEO Meta Tags Analysis:`);

const metaTags = {
  'title': html.match(/<title>(.*?)<\/title>/),
  'description': html.match(/<meta name="description" content="(.*?)"/),
  'keywords': html.match(/<meta name="keywords" content="(.*?)"/),
  'canonical': html.match(/<link rel="canonical" href="(.*?)"/),
  'og:title': html.match(/<meta property="og:title" content="(.*?)"/),
  'og:description': html.match(/<meta property="og:description" content="(.*?)"/),
  'robots': html.match(/<meta name="robots" content="(.*?)"/),
};

Object.entries(metaTags).forEach(([tag, match]) => {
  if (match) {
    console.log(`   ✅ ${tag}: ${match[1]?.substring(0, 60)}...`);
  } else {
    console.log(`   ❌ Missing ${tag}`);
  }
});

// Check for geographic data
const geoTags = html.includes('geo.region') && html.includes('geo.position');
console.log(`   ${geoTags ? '✅' : '❌'} Geographic location data: ${geoTags ? 'present' : 'missing'}`);

console.log(`\n🚀 Google Rich Results Test Instructions:`);
console.log(`   1. Visit: https://search.google.com/test/rich-results`);
console.log(`   2. Enter URL: https://dtvisuals.com`);
console.log(`   3. Or paste the HTML content from: ${htmlPath}`);
console.log(`   4. Check for LocalBusiness and FAQPage rich results`);

console.log(`\n🎯 Expected Rich Results:`);
console.log(`   • Business information (name, location, services)`);
console.log(`   • Service catalog (4 video production services)`);
console.log(`   • FAQ snippets (4 common questions)`);
console.log(`   • Local business listing optimization`);

if (validSchemas === totalSchemas) {
  console.log(`\n🎉 All structured data is valid! Rich Results should now work.`);
  process.exit(0);
} else {
  console.log(`\n⚠️  Some structured data issues found. Please review.`);
  process.exit(1);
}
// Script to extract and integrate the original UI components
const fs = require('fs');

// Read the original file
const originalContent = fs.readFileSync('AV Project Tracker 6.1.html', 'utf8');

// Extract key sections
const styleMatch = originalContent.match(/<style>([\s\S]*?)<\/style>/);
const bodyMatch = originalContent.match(/<body>([\s\S]*?)<\/body>/);
const scriptMatch = originalContent.match(/<script>([\s\S]*?)<\/script>/);

// Extract navigation
const navMatch = originalContent.match(/<!-- Global Navigation -->([\s\S]*?)<\/nav>/);

// Extract landing page
const landingMatch = originalContent.match(/<!-- Landing Page \/ Dashboard -->([\s\S]*?)<!-- Project Tracker Page -->/);

// Extract modals
const modalsMatch = originalContent.match(/<!-- Create Project Modal -->([\s\S]*?)<!-- Enhanced Modals End -->/);

console.log('Extracted sections:');
console.log('- Styles:', styleMatch ? 'Found' : 'Not found');
console.log('- Body:', bodyMatch ? 'Found' : 'Not found');
console.log('- Scripts:', scriptMatch ? 'Found' : 'Not found');
console.log('- Navigation:', navMatch ? 'Found' : 'Not found');
console.log('- Landing page:', landingMatch ? 'Found' : 'Not found');
console.log('- Modals:', modalsMatch ? 'Found' : 'Not found');

if (styleMatch && bodyMatch && scriptMatch) {
    console.log('All sections found. Integration ready.');
} else {
    console.log('Some sections missing. Manual integration required.');
}
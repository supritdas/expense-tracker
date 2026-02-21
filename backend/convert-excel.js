const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Try different possible locations
const possiblePaths = [
  path.join(__dirname, 'data 1.xlsx'),           // In backend folder
  path.join(__dirname, '../data 1.xlsx'),        // In parent folder
  'D:/CODEPLAY/student-expense-tracker/backend/data 1.xlsx',  // Absolute path
  'data 1.xlsx'                                   // Current directory
];

let excelPath = null;

// Find the file
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    excelPath = p;
    console.log(`✅ Found Excel file at: ${p}`);
    break;
  }
}

if (!excelPath) {
  console.error('❌ Error: Could not find "data 1.xlsx" in any of these locations:');
  possiblePaths.forEach(p => console.log(`   - ${p}`));
  console.log('\n📁 Please copy "data 1.xlsx" to the backend folder and try again.');
  process.exit(1);
}

try {
  // Read the Excel file
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 Found ${data.length} rows in Excel`);
  console.log('📋 Column names:', Object.keys(data[0] || {}));


  // Transform data to match our format
const students = data.map((row, index) => ({
  regNo: String(row.regNo || row.RegNo || row['Registration Number']).padStart(8, '0'),
  Name: String(row.Name || row.name || `Student ${index + 1}`),
  Email: String(row.Email || row.email || `student${index}@university.edu`),
  Department: String(row.Department || row.department || 'General'),
  Year: Number(row.Year || row.year || 1)
}));

  // Save as JSON
  const outputPath = path.join(__dirname, 'students.json');
  fs.writeFileSync(outputPath, JSON.stringify(students, null, 2));
  
  console.log(`\n✅ Successfully converted ${students.length} students!`);
  console.log(`💾 Saved to: ${outputPath}`);
  console.log('\n👤 First student:');
  console.log(JSON.stringify(students[0], null, 2));
  
} catch (error) {
  console.error('❌ Error processing Excel file:', error.message);
  process.exit(1);
}
const fs = require('fs');
const path = require('path');

const EXCLUDE = ['node_modules', '.expo', 'dist', 'build', 'find-error.js'];
const EXTENSIONS = ['.tsx', '.jsx'];

function searchFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const errors = [];

  // Buscar CUALQUIER texto fuera de <Text>
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    // Ignorar comentarios e imports
    if (trimmed.startsWith('//') || 
        trimmed.startsWith('/*') || 
        trimmed.startsWith('import') ||
        trimmed.startsWith('*')) return;

    // Patrones peligrosos
    const dangers = [
      { pattern: /return\s*\(\s*$/, name: 'return vacío' },
      { pattern: /{\s*\w+\s*\?\s*['"`][^'"`]+['"`]\s*:/, name: 'ternario con string' },
      { pattern: /{\s*\w+\s*&&\s*['"`]/, name: '&& con string' },
      { pattern: />\s*{\s*\w+\s*}\s*</, name: 'variable sin Text' },
      { pattern: /<View[^>]*>\s*['"`]/, name: 'View con string directo' },
      { pattern: /:\s*['"`][^'"`]+['"`]\s*}/, name: 'ternario falsy string' }
    ];

    dangers.forEach(({ pattern, name }) => {
      if (pattern.test(line) && !line.includes('<Text')) {
        errors.push({
          file: filePath.replace(process.cwd(), ''),
          line: idx + 1,
          content: trimmed.substring(0, 80),
          type: name
        });
      }
    });
  });

  return errors;
}

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!EXCLUDE.some(e => filePath.includes(e))) {
        results = results.concat(walkDir(filePath));
      }
    } else if (EXTENSIONS.includes(path.extname(file))) {
      results = results.concat(searchFile(filePath));
    }
  });

  return results;
}

console.log('🔍 BUSCANDO ERRORES DE TEXT...\n');

const errors = walkDir(process.cwd());

if (errors.length === 0) {
  console.log('✅ No se encontraron errores.\n');
} else {
  console.log(`❌ ${errors.length} ERRORES ENCONTRADOS:\n`);
  
  // Agrupar por archivo
  const byFile = {};
  errors.forEach(e => {
    if (!byFile[e.file]) byFile[e.file] = [];
    byFile[e.file].push(e);
  });

  Object.entries(byFile).forEach(([file, errs]) => {
    console.log(`\n📄 ${file}`);
    errs.forEach(e => {
      console.log(`   Línea ${e.line} [${e.type}]`);
      console.log(`   ${e.content}`);
    });
  });
}
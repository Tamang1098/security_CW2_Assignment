const fs = require('fs');
const path = require('path');

const stripComments = (content, ext) => {
    if (ext === '.js') {




        content = content.replace(/^[ \t]*\/\/.*$/gm, '');


        content = content.replace(/[ \t]+\/\/.*$/gm, '');


        content = content.replace(/^[ \t]*\/\*[\s\S]*?\*\//gm, '');

        return content.trim();
    } else if (ext === '.css') {
        return content.replace(/\/\*[\s\S]*?\*\//gm, '').trim();
    }
    return content;
};

const processDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.gemini' && file !== 'certs') {
                processDirectory(filePath);
            }
        } else {
            const ext = path.extname(file);
            if (ext === '.js' || ext === '.css') {
                const content = fs.readFileSync(filePath, 'utf8');
                const stripped = stripComments(content, ext);
                if (stripped !== content) {
                    fs.writeFileSync(filePath, stripped);
                    console.log(`Comments removed from: ${filePath}`);
                }
            }
        }
    });
};

const projectRoot = 'c:\\Users\\Lenovo\\Security_CW2_Assignment';
console.log('Starting safe comment removal...');
processDirectory(projectRoot);
console.log('Finished.');
import fs from 'fs';
let code = fs.readFileSync('src/components/FirstAidView.tsx', 'utf8');

// For outer ring scale
code = code.replace(
  /breathingPhase === 'hold1' \? 1\.45 :/g,
  `breathingPhase === 'hold1' ? 1.45 :
                          breathingPhase === 'hold2' ? 1 :`
);

// For main ball background
code = code.replace(
  /breathingPhase === 'exhale' \? '#fbeee9' : '#f5f1e9',/g,
  `breathingPhase === 'exhale' ? '#fbeee9' :
                          breathingPhase === 'hold2' ? '#eef2f5' : '#f5f1e9',`
);

// For main ball border
code = code.replace(
  /breathingPhase === 'exhale' \? '#df7a5e' : '#a8bfa9',/g,
  `breathingPhase === 'exhale' ? '#df7a5e' :
                          breathingPhase === 'hold2' ? '#a5b4c4' : '#a8bfa9',`
);

fs.writeFileSync('src/components/FirstAidView.tsx', code);

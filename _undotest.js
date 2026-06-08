// Simulate the real snapshot/restore + endDrag wiring with plain state (no DOM)
let grid = Array.from({length:8},()=>Array(8).fill(0));
let availableShapes = [];
let score = 0, comboStreak = 0, linesClearedThisRound = false;
let undoState = null;

function snapshotState(){return {
  grid: grid.map(r=>r.slice()),
  availableShapes: availableShapes.map(s=> s ? {blocks:s.blocks.map(r=>r.slice()),colorId:s.colorId,previewCellSize:s.previewCellSize,baseX:s.baseX,baseY:s.baseY}:null),
  score, comboStreak, linesClearedThisRound
};}
function performUndo(){
  grid = undoState.grid.map(r=>r.slice());
  availableShapes = undoState.availableShapes.map(s=> s ? {blocks:s.blocks.map(r=>r.slice()),colorId:s.colorId,previewCellSize:s.previewCellSize,baseX:s.baseX,baseY:s.baseY}:null);
  score=undoState.score; comboStreak=undoState.comboStreak; linesClearedThisRound=undoState.linesClearedThisRound;
  undoState=null;
}
function refillShapes(){ // mimic shuffle+new generation
  availableShapes = [mk('X',100),mk('Y',200),mk('Z',300)].sort(()=>Math.random()-0.5);
}
function mk(id,bx){return {blocks:[[1]],colorId:id,previewCellSize:45,baseX:bx,baseY:700};}
function placeNonClearing(idx,r,c){
  const preMove = snapshotState();
  grid[r][c]=availableShapes[idx].colorId; // place
  availableShapes[idx]=null;
  score+=1;
  undoState = preMove;            // enable undo (non-clear)
  if(availableShapes.every(s=>s===null)) refillShapes(); // finalizeTurn refill
}

// ---- Scenario A: place 1st of 3, undo ----
availableShapes=[mk('A',100),mk('B',200),mk('C',300)];
const beforeA = JSON.stringify(availableShapes);
placeNonClearing(0,0,0);
performUndo();
console.log('A panel restored exactly:', JSON.stringify(availableShapes)===beforeA, '| score', score);

// ---- Scenario B: place all 3 (refill on 3rd), then undo the 3rd ----
availableShapes=[mk('A',100),mk('B',200),mk('C',300)]; score=0; grid=Array.from({length:8},()=>Array(8).fill(0));
placeNonClearing(0,0,0); // A
placeNonClearing(1,1,0); // B
const panelBefore3rd = JSON.stringify(availableShapes); // [null,null,C]
placeNonClearing(2,2,0); // C -> triggers refill
console.log('B after 3rd move panel is refilled (3 shapes):', availableShapes.filter(Boolean).length);
performUndo();
console.log('B undo restores exact pre-3rd-move panel [null,null,C]:', JSON.stringify(availableShapes)===panelBefore3rd);
console.log('B restored shape colorId:', availableShapes.map(s=>s?s.colorId:null).join(','), '| score', score);

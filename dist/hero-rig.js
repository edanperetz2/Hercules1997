// Articulated limbs are drawn around joints; the generated portrait is reused
// for the head. Motion stays tied to velocity and action timing, not wall time.
export function drawHero(c, portrait, x, feet, height, dir, frame, phase, time, alpha = 1) {
  const run = frame >= 1 && frame <= 4, cycle = phase * 2.8, stride = Math.sin(cycle);
  let bob = run ? -Math.abs(Math.cos(cycle)) * 2.4 : Math.sin(time * 2) * .6;
  let legs = [[-6,-47,-10,-25,-12,-3],[5,-47,9,-25,11,-3]];
  let arms = [[-9,-88,-17,-68,-8,-56],[12,-88,23,-69,24,-53]];
  let lean = run ? .065 : 0, swordAngle = -.25;
  if (run) {
    legs = [[-6,-47,-9 + stride*16,-25,-6+stride*27,-3-Math.max(0,-stride)*14],[5,-47,9-stride*16,-25,5-stride*27,-3-Math.max(0,stride)*14]];
    arms = [[-9,-88,-15-stride*9,-70,-9-stride*20,-57],[12,-88,20+stride*10,-71,20+stride*18,-58]];
  }
  if (frame === 5 || frame === 6) {
    legs = [[-6,-47,-19,-30,-27,-13],[5,-47,20,-44,13,-21]];
    arms = [[-9,-88,-25,-78,-29,-95],[12,-88,28,-77,36,-87]]; lean = -.075; swordAngle = -1.3;
    if (frame === 6) legs = [[-6,-47,-18,-34,-2,-26],[5,-47,22,-42,14,-24]];
  }
  if (frame === 7) { legs=[[-6,-47,-15,-24,-19,-5],[5,-47,16,-25,18,-2]]; arms=[[-9,-88,-27,-83,-35,-97],[12,-88,30,-84,39,-96]]; swordAngle=-1.2; }
  if (frame === 8 || frame === 12) { bob=14; lean=.12; legs=[[-6,-47,-27,-24,-21,-17],[5,-47,31,-27,32,-17]]; arms=[[-9,-88,-27,-72,-19,-55],[12,-88,27,-66,22,-53]]; }
  if (frame === 9 || frame === 12) { arms[1]=[12,-88,2,-110,-19,-112]; swordAngle=-1.5; lean=-.12; }
  if (frame === 10) { legs=[[-6,-47,-24,-25,-32,-3],[5,-47,24,-31,32,-3]]; arms=[[-9,-88,-21,-72,-14,-55],[12,-88,36,-84,57,-82]]; swordAngle=.06; lean=.12; }
  if (frame === 11) { arms[1]=[12,-88,31,-72,42,-62]; swordAngle=.65; lean=.04; }
  if (frame === 13) { arms=[[-9,-88,-14,-103,-11,-121],[12,-88,32,-89,55,-90]]; swordAngle=-1.2; }
  if (frame === 14) { arms=[[-9,-88,-29,-82,-36,-98],[12,-88,22,-105,34,-104]]; legs=[[-6,-47,-11,-26,-25,-12],[5,-47,19,-30,29,-15]]; lean=-.2; }
  if (frame === 15) { arms=[[-9,-88,-23,-111,-14,-131],[12,-88,28,-111,19,-134]]; swordAngle=-1.45; }
  c.save(); c.translate(x,feet+bob*height/127); c.scale(dir*height/127,height/127); c.globalAlpha=alpha;
  c.lineJoin='round'; c.lineCap='round';
  const shape=(points,fill,stroke='#40271c',width=1.5)=>{c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=width;c.stroke();};
  const limb=(a,width,light,dark)=>{c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(a[2],a[3]);c.lineTo(a[4],a[5]);c.strokeStyle='#493021';c.lineWidth=width+2.5;c.stroke();c.strokeStyle=dark;c.lineWidth=width;c.stroke();c.beginPath();c.moveTo(a[0]+1,a[1]);c.lineTo(a[2]+1,a[3]);c.lineTo(a[4]+1,a[5]);c.strokeStyle=light;c.lineWidth=width*.52;c.stroke();};
  const leg=(a,back)=>{
    limb(a,11,back?'#dc914c':'#ffc47a',back?'#b8753f':'#df9553');
    const foot=[a[4],a[5]];
    shape([[foot[0]-5,foot[1]-11],[foot[0]+5,foot[1]-11],[foot[0]+5,foot[1]-2],[foot[0]+14,foot[1]+1],[foot[0]+13,foot[1]+4],[foot[0]-6,foot[1]+4]],back?'#6d432b':'#955d32');
    c.strokeStyle='#d5a268';c.lineWidth=2;for(let n=0;n<3;n++){c.beginPath();c.moveTo(foot[0]-5,foot[1]-10+n*4);c.lineTo(foot[0]+5,foot[1]-7+n*4);c.stroke();}
  };
  // Cape flexes with the stride and rises during a jump.
  const airborne = frame >= 5 && frame <= 7, flutter = Math.sin(cycle)*4;
  shape([[-5,-96],[-22,-86],[-42-flutter,-61],[-48-flutter,airborne?-76:-36],[-30,-44],[1,-71]],'#244b9b','#102d62');
  shape([[-12,-87],[-26,-70],[-38-flutter,airborne?-73:-47],[-19,-56],[0,-77]],'#3976c7','#244c91',.7);
  leg(legs[0],true); limb(arms[0],12,'#e8a15b','#c68142');
  c.save(); c.translate(0,-70); c.rotate(lean); c.translate(0,70);
  // Sleeveless, short orange-brown tunic and blue belt match the reference.
  shape([[-11,-95],[11,-96],[20,-88],[14,-72],[13,-57],[20,-41],[-19,-41],[-12,-62],[-17,-84]],'#b87531');
  shape([[-8,-93],[10,-93],[15,-85],[7,-71],[10,-57],[-9,-57],[-12,-78]],'#e3a34b','#b27131',.7);
  shape([[-17,-55],[15,-55],[20,-41],[-19,-41]],'#c37b32');
  c.strokeStyle='#e8ac55';c.lineWidth=1.4;for(let n=-10;n<=12;n+=8){c.beginPath();c.moveTo(n,-52);c.lineTo(n+2,-42);c.stroke();}
  shape([[-12,-60],[14,-60],[15,-55],[-13,-55]],'#3265a5','#193657',1);
  shape([[-4,-59],[2,-59],[2,-55],[-4,-55]],'#e4b859','#7b5631',.6);
  // Portrait includes hair, face, and neck; no rigid full-body image is used.
  if (portrait?.complete && portrait.naturalWidth) c.drawImage(portrait,-5,-129,31,39);
  c.restore();
  limb(arms[1],13,'#ffc983','#e5a15d');
  for (const arm of arms) {
    c.strokeStyle='#724529';c.lineWidth=7;c.beginPath();c.moveTo(arm[4]-1,arm[5]-7);c.lineTo(arm[4]+1,arm[5]-1);c.stroke();
    c.strokeStyle='#d59a47';c.lineWidth=2;c.stroke();
  }
  const hand = arms[1];
  // The sword moves with the hand through wind-up, contact and recovery.
  c.save(); c.translate(hand[4],hand[5]); c.rotate(swordAngle);
  shape([[4,-3],[frame===10?76:63,-2],[frame===10?85:72,0],[frame===10?76:63,4],[4,4]],'#e7edf0','#536978',1);
  c.strokeStyle='#fff7d3';c.lineWidth=1;c.beginPath();c.moveTo(7,-1);c.lineTo(frame===10?76:64,-1);c.stroke();
  shape([[-5,-3],[4,-3],[4,4],[-5,4]],'#8e5830');
  shape([[2,-9],[6,-9],[6,9],[2,9]],'#edbf57','#694625',1);c.restore();
  leg(legs[1],false);
  c.restore();
}

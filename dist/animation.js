// Atlas order: idle, four run poses, rise/apex/fall, landing, three
// sword poses, charged wind-up, magic, recoil, victory.
export function heroFrame(player, state = 'playing') {
  if (state === 'clear') return 15;
  if (player.hurtTimer > 0) return 14;
  if (player.attack > 0) {
    const duration = player.attackHeavy ? .38 : .27;
    const progress = 1 - player.attack / duration;
    return progress < .22 ? 9 : progress < .76 ? 10 : 11;
  }
  if (player.castTimer > 0) return 13;
  if (player.charge > .35) return 12;
  if (!player.grounded) return player.vy < -170 ? 5 : player.vy > 170 ? 7 : 6;
  if (player.landTimer > 0) return 8;
  if (Math.abs(player.vx) > 35) return 1 + Math.floor(player.anim * 1.8) % 4;
  return 0;
}

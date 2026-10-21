import assert from 'node:assert/strict';
import { gestureFromHands, moveCamera } from '../js/hand-gesture-math.mjs';
const hand = (x, pinched=true) => {
 const points=Array.from({length:21},()=>({x,y:0.5}));
 points[0]={x,y:0.8};points[9]={x,y:0.5};
 points[4]={x:x-0.01,y:0.4};points[8]={x:x+(pinched?0.01:0.2),y:0.4};
 return points;
};
assert.equal(gestureFromHands([]),null);
assert.equal(gestureFromHands([hand(.4,false)]),null);
assert.equal(gestureFromHands([hand(.4)]).mode,'rotate');
assert.equal(gestureFromHands([hand(.3),hand(.7)]).mode,'zoom');
assert.equal(gestureFromHands([hand(.3),hand(.7,false)]),null);
const orbit={theta:0,phi:1.5,radius:10},limits={min:5,max:20};
assert.deepEqual(moveCamera(null,{mode:'rotate',x:.5,y:.5},orbit,limits),orbit);
assert.deepEqual(moveCamera({mode:'rotate'},{mode:'zoom'},orbit,limits),orbit);
assert.ok(moveCamera({mode:'rotate',x:.4,y:.5},{mode:'rotate',x:.5,y:.4},orbit,limits).theta>0);
assert.ok(moveCamera({mode:'zoom',distance:.2},{mode:'zoom',distance:.3},orbit,limits).radius<10);
assert.ok(moveCamera({mode:'zoom',distance:.3},{mode:'zoom',distance:.2},orbit,limits).radius>10);
assert.equal(moveCamera({mode:'zoom',distance:.2},{mode:'zoom',distance:1},{...orbit,radius:5},limits).radius,5);
console.log('Gesture geometry: 10 assertions passed');


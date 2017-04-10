var can = document.querySelector('canvas');
var ctx = can.getContext('2d');
var hpoints = [];
var vpoints = [];
var smcount = 6;
var smoff = 20;
var tessSize=100;

var tile = [
  {x: 100, y: 100},
  {x: 200, y: 100},
  {x: 200, y: 200},
  {x: 100, y: 200},
  {x: 100, y: 100}
];

var cut = [
  {x: 0, y: 90},
  {x: 125, y: 150},
  {x: 175, y: 170},
  {x: 300, y: 250}
];

init();

function init () {
  can.width = can.width|0;
  drawPts(tile, '#eee');
  drawLines(tile, '#eee');

  drawPts(cut, '#666');
  drawLines(cut, '#666');

  let overlaps = testPathsForOverlaps(tile,cut);
  for (let over of overlaps) {
    drawOverlap(over);
  }

  let shapeDivisions = findShapeDivisions(tile, cut, overlaps);
  //splitPathByCut(tile, overlaps);
}

function splitPathByCut (path, overlaps) {
  let q1 = path.slice();
  if (!pathIsClosed(q1)) return null;

  let overlapPts = [];
  for (let over of overlaps) {
    for (let i=0; i<path.length; i++) {
      let pt = path[i];
      if (pt.x == over.segA[0].x && pt.y == over.segA[0].y) {
        overlapPts.push([i+1,over.contact]);
      }
    }
  }

  //expecting overlaps length to be even
  overlapPts = overlapPts.sort(smallestIndex);
  let startIndex = overlapPts[0][0];
  let endIndex = overlapPts[1][0];

  let chunkA = path.slice(startIndex, endIndex);
  chunkA.unshift(overlapPts[0][1]);
  chunkA.push(overlapPts[1][1]);

  ctx.lineWidth = 5;
  drawLines(chunkA, '#00f');
  ctx.lineWidth = 1;


}

function findShapeDivisions (p1, p2, overlaps) {
  //first, add contact points to paths
  let q1 = p1.slice();
  let q2 = p2.slice();
  let ptsToInsertInQ1 = [];
  let ptsToInsertInQ2 = [];
  for (let over of overlaps) {
    for (let i=0; i<q1.length; i++) {
      let pt = q1[i];
      if (pt.x == over.segA[0].x && pt.y == over.segA[0].y) {
        ptsToInsertInQ1.push([i+1,over.contact]);
      }
    }

    for (let i=0; i<q2.length; i++) {
      let pt = q2[i];
      if (pt.x == over.segC[0].x && pt.y == over.segC[0].y) {
        ptsToInsertInQ2.push([i+1,over.contact]);
      }
    }
  }

  ptsToInsertInQ1 = ptsToInsertInQ1.sort(largestIndex);
  ptsToInsertInQ2 = ptsToInsertInQ2.sort(largestIndex);

  // add points to Q arrays from end of array to beginning

  for (let pair of ptsToInsertInQ1) {
    q1.splice(pair[0], 0, pair[1]);
  }

  for (let pair of ptsToInsertInQ2) {
    q2.splice(pair[0], 0, pair[1]);
  }

}

function smallestIndex (a,b) {
  if (a[0] < b[0]) {
    return -1;
  }
  else if (a[0] > b[0]) {
    return 1;
  }
  return 0;
}

function largestIndex (a,b) {
  if (a[0] < b[0]) {
    return 1;
  }
  else if (a[0] > b[0]) {
    return -1;
  }
  return 0;
}

function pathIsClosed (path) {
  let st = path[0], fn = path[path.length-1];
  return st.x == fn.x && st.y == fn.y;
}

function testPathsForOverlaps (p1, p2) {
  let overlaps = [];
  for (let j=1; j<p1.length; j++) {
    for (let k=1; k<p2.length; k++) {
      let testPts = [p1[j-1],p1[j],p2[k-1],p2[k]];
      let doBoundsCross = checkBBoxes.apply(null, testPts);
      let doLinesCross = checkIfLinesCross.apply(null,testPts);

      if (doBoundsCross && doLinesCross) {
        let cInt = lineIntersect.apply(null,testPts);
        let onSeg = onSegment(testPts[0], testPts[1], cInt) &&
                    onSegment(testPts[2], testPts[3], cInt);

        if (onSeg) {
          let over = {
            contact: cInt,
            segA: [p1[j-1], cInt],
            segB: [cInt, p1[j]],
            segC: [p2[k-1], cInt],
            segD: [cInt, p2[k]]
          };

          overlaps.push(over);
        }
      }
    }
  }
  return overlaps;
}

function drawPts (points, color) {
  ctx.fillStyle = color;
  for (let pt of points) {
    ctx.fillRect(pt.x-2, pt.y-2,4,4);
  }
}

function drawLines (points, color) {
  ctx.beginPath();
  for (let i=1; i<points.length; i++) {
    ctx.moveTo(points[i-1].x,points[i-1].y);
    ctx.lineTo(points[i].x,points[i].y);
  }
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawOverlap(over) {
  drawLines(over.segA, '#f60');
  drawLines(over.segB, '#6f0');
  drawLines(over.segC, '#06f');
  drawLines(over.segD, '#60f');

  //draw crossing points
  drawPts([over.contact], '#f03');
}

function checkBBoxes(p,q,r,s) {
  //assume pq and rs are 2 separate lines
  let bbA = [
    { x: Math.min(p.x, q.x), y: Math.min(p.y, q.y) },
    { x: Math.max(p.x, q.x), y: Math.max(p.y, q.y) }
  ];
  let bbB = [
    { x: Math.min(r.x, s.x), y: Math.min(r.y, s.y) },
    { x: Math.max(r.x, s.x), y: Math.max(r.y, s.y) }
  ];

  return bbA[0].x <= bbB[1].x &&
         bbA[1].x >= bbB[0].x &&
         bbA[0].y <= bbB[1].y &&
         bbA[1].y >= bbB[0].y;
}

function onSegment (p,q,r) {
  //returns true if r is on line pq
    return (r.x <= Math.max(p.x, q.x) && r.x >= Math.min(p.x, q.x) &&
           r.y <= Math.max(p.y, q.y) && r.y >= Math.min(p.y, q.y));
}

function triArea (p,q,r) {
  //returns signed area
  //clockwise is positive
  return 0.5 * (p.x * (q.y - r.y) + q.x * (r.y - p.y) + r.x * (p.y - q.y));
}

function isOnLeft (p,q,r) {
  return triArea(p,q,r) > 0;
}

function isOnRight (p,q,r) {
  return triArea(p,q,r) < 0;
}

function checkIfLinesCross (p,q,r,s) {
  let rIsOnLeft = isOnLeft(p,q,r);
  let sIsOnLeft = isOnLeft(p,q,s);
  let rIsOnRight = isOnRight(p,q,r);
  let sIsOnRight = isOnRight(p,q,s);
  return rIsOnLeft !== sIsOnLeft;
}

function lineIntersect (p,q,r,s) {
  // http://stackoverflow.com/a/38977789
  // not to be confused with line segment intersect
  let ua, ub, denom = (s.y - r.y)*(q.x - p.x) - (s.x - r.x)*(q.y - p.y);
  if (denom === 0) {
    return null;
  }
  ua = ((s.x - r.x)*(p.y - r.y) - (s.y - r.y)*(p.x - r.x))/denom;
  ub = ((q.x - p.x)*(p.y - r.y) - (q.y - p.y)*(p.x - r.x))/denom;
  return {
    x: p.x + ua*(q.x - p.x),
    y: p.y + ua*(q.y - p.y)
  };
}

var can = document.querySelector('canvas'),
    ctx = can.getContext('2d');

var z = 6;

var app = new Vue({
  el: '#app',
  created: function () {
    this.drawCheckerboard();
    this.updateBG();
    setTimeout(() => {
      this.showTitle = false;
    }, 3000)
  },
  data: function () {
    return {
      colors: ['#ff0000', '#cccccc'],
      tileSize: can.width/2,
      brushSize: 5,
      bgURL:'',
      showTitle: true
    };
  },
  methods: {
    swapColor: function () {
      this.colors = [this.colors[1],this.colors[0]];
    },
    mouseHandler: function (e) {
      e.preventDefault();
      if (e.buttons) {
        this.drawPt(e.clientX % can.width, e.clientY % can.height);
      }
    },
    drawPt: function (x,y) {
      for (let i=-2; i<4; i++) {
        for (let j=-2; j<4; j++) {
          let dx = x + (i * this.tileSize);
          let dy = y + (j * this.tileSize);
          ctx.fillStyle = this.colors[(3*(j+1)+(i+1))%2];
          ctx.beginPath();
          ctx.arc(dx,dy,this.brushSize,0,Math.PI*2,false);
          ctx.fill();
        }
      }
      this.updateBG();
    },
    updateBG() {
      this.bgURL = can.toDataURL();
    },
    drawCheckerboard: function () {
      for (let i=-1; i<2; i++) {
        for (let j=-1; j<2; j++) {
          let dx = i * this.tileSize % can.width;
          let dy = j * this.tileSize % can.height;
          ctx.fillStyle = this.colors[(3*(j+1)+(i+1))%2];
          ctx.fillRect(dx+this.tileSize/2, dy+this.tileSize/2,this.tileSize,this.tileSize);
        }
      }
    }
  }
});

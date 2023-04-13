console.clear();
const log = (...args) => console.log(args);

// FACTORY
const COLORS = [
  "#f7d046",
  "#ff4c5a",
  "#f08cba",
  "#49c4d2",
  "#924e84",
  "#fd926f",
  "#245a65",
  "#ff6a76",
  "#633d89",
];
const PI = Math.PI;
const TAU = PI * 2;

const degToRad = (deg) => (deg / 180) * PI;

const getCoordOnCircle = (r, angleInRad, { cx, cy }) => {
  return {
    x: cx + r * Math.cos(angleInRad),
    y: cy + r * Math.sin(angleInRad),
  };
};

const wheelFactory = (mountElem) => {
  if (!mountElem || !("nodeType" in mountElem)) {
    throw new Error("no mount element provided");
  }

  const eventMap = {
    mousedown: handleCursorDown,
    touchstart: handleCursorDown,
    mousemove: handleCursorMove,
    touchmove: handleCursorMove,
    mouseup: handleCursorUp,
    touchend: handleCursorUp,
  };
  const ratios = {
    tickerRadius: 0.06, // of width
    textSize: 0.12, // of radius
    edgeDist: 0.14, // of radius
  };
  let options = {
    width: 360,
    height: 360,
    type: "svg",
  };
  const friction = 0.95;
  const maxSpeed = 0.5;
  let isGroupActive = false;
  let curPosArr = [];
  let dirScalar = 1;
  let lastCurTime;
  let speed;
  let words;
  let two;
  let group;

  function init(opts) {
    options = { ...options, ...opts };
    two = new Two({
      type: Two.Types[options.type],
      width: options.width,
      height: options.height,
    })
      .bind("resize", handleResize)
      .play();
    //handle mouse spin on wheel
    //initEvents();
    two.appendTo(mountElem);
    setViewBox(options.width, options.height);
    two.renderer.domElement.setAttribute(
      "style",
      `
        -moz-user-select:none;
        -ms-user-select:none;
        -webkit-user-select:none;
        user-select:none;
        -webkit-tap-highlight-color: rgba(0,0,0,0);
      `
    );
  }

  function setWords(wordsArr) {
    words = wordsArr;
  }

  function setViewBox(width, height) {
    two.renderer.domElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  function drawTicker() {
    const { width } = two;
    const outerRadius = ratios.tickerRadius * width;

    const tickerCircle = drawTickerCircle(outerRadius);
    const circleCenter = tickerCircle.translation;

    drawTickerArrow(outerRadius, degToRad(30), circleCenter);
  }

  function drawTickerCircle(outerRadius) {
    const { height, width } = two;
    const arc = two.makeArcSegment(
      width - outerRadius,
      height / 2,
      outerRadius,
      outerRadius * 0.5,
      0,
      2 * PI
    );
    arc.noStroke();

    return arc;
  }

  function drawTickerArrow(radius, tangentAngle, tickerCenter) {
    const { x, y } = tickerCenter;

    const pointA = getCoordOnCircle(radius, PI, { cx: x, cy: y });
    const pointB = getCoordOnCircle(radius, PI / 2 + tangentAngle, {
      cx: x,
      cy: y,
    });
    const pointC = {
      x: x - radius / Math.cos(PI / 2 - tangentAngle),
      y: y,
    };
    const pointD = getCoordOnCircle(radius, (3 * PI) / 2 - tangentAngle, {
      cx: x,
      cy: y,
    });
    const path = two.makePath(
      pointA.x,
      pointA.y,
      pointB.x,
      pointB.y,
      pointC.x,
      pointC.y,
      pointD.x,
      pointD.y
    );
    path.noStroke();

    return path;
  }

  function drawWheel() {
    if (group) {
      destroyPaths();
    }

    const { width } = two;
    const numColors = COLORS.length;
    const rotationUnit = (2 * PI) / words.length;
    const xOffset = width * ratios.tickerRadius * 2;
    const radius = (width - xOffset * 2) / 2;
    const center = {
      x: width / 2,
      y: radius + xOffset,
    };
    group = two.makeGroup();

    words.map((word, i, arr) => {
      const angle = rotationUnit * i - (PI + rotationUnit) / 2;
      const arc = two.makeArcSegment(
        center.x,
        center.y,
        0,
        radius,
        0,
        (2 * PI) / arr.length
      );
      arc.rotation = angle;
      arc.noStroke();
      arc.fill = COLORS[i % numColors];

      const textVertex = {
        x:
          center.x +
          (radius - radius * ratios.edgeDist) *
            Math.cos(angle + rotationUnit / 2),
        y:
          center.y +
          (radius - radius * ratios.edgeDist) *
            Math.sin(angle + rotationUnit / 2),
      };

      const text = two.makeText(word, textVertex.x, textVertex.y);
      text.rotation = rotationUnit * i - PI / 2;
      text.alignment = "right";
      text.fill = "#fff";
      text.size = radius * ratios.textSize;

      return group.add(arc, text);
    });

    group.translation.set(center.x, center.y);
    group.center();
    drawTicker();

    two.update();
  }

  function handleResize() {
    setViewBox(two.width, two.height);
    drawWheel();
    drawTicker();
    two.update();
  }

  function handleCursorDown(e) {
    const groupElem = group._renderer.elem;

    isGroupActive = groupElem === e.target || groupElem.contains(e.target);
    curPosArr = isGroupActive ? curPosArr.concat(getEventPos(e)) : curPosArr;
    lastCurTime = performance.now();
  }

  function handleCursorMove(e) {
    if (isGroupActive && curPosArr.length) {
      e.preventDefault();
      lastCurTime = performance.now();
      curPosArr = curPosArr.concat(getEventPos(e));
      const currPos = curPosArr[curPosArr.length - 1];
      const prevPos = curPosArr[curPosArr.length - 2];
      const groupBounds = group._renderer.elem.getBoundingClientRect();
      const groupCenter = {
        x: groupBounds.left + groupBounds.width / 2,
        y: groupBounds.top + groupBounds.height / 2,
      };
      const angleAtCursorDown = Math.atan2(
        prevPos.y - groupCenter.y,
        prevPos.x - groupCenter.x
      );
      const angleAtCursorNow = Math.atan2(
        currPos.y - groupCenter.y,
        currPos.x - groupCenter.x
      );
      const deltaRotation = angleAtCursorNow - angleAtCursorDown;
      dirScalar = deltaRotation > 0 ? 1 : -1;

      group.rotation = (group.rotation + deltaRotation) % TAU;

      handleRotationChange(group.rotation);

      two.update();
    }
  }

  function handleCursorUp(e) {
    if (isGroupActive && curPosArr.length > 1) {
      const currPos = getEventPos(e);
      const lastPos = curPosArr[curPosArr.length - 2];
      const timeNow = performance.now();
      const time = timeNow - lastCurTime;
      const distance = Math.sqrt(
        Math.pow(currPos.x - lastPos.x, 2) + Math.pow(currPos.y - lastPos.y, 2)
      );
      speed = Math.min(distance / time, maxSpeed);

      two.bind("update", animateWheel);
    }

    curPosArr = [];
    isGroupActive = false;
  }

  function getEventPos(e) {
    const { clientX: x, clientY: y } = getEvent(e);

    return { x, y };
  }

  function getEvent(e) {
    return e.changedTouches ? e.changedTouches[0] : e;
  }

  function animateWheel() {
    group.rotation = (group.rotation + speed * dirScalar) % TAU;
    speed = speed * friction;

    handleRotationChange(group.rotation);

    if (speed < 0.005) {
      two.unbind("update", animateWheel);
    }
  }

  function handleRotationChange(angle) {
    if (options.onWheelTick && typeof options.onWheelTick === "function") {
      options.onWheelTick(angle);
    }
  }

  function spin(newSpeed) {
    speed = newSpeed;
    two.bind("update", animateWheel);
  }

  function updateDims({ height, width }) {
    two.width = parseInt(width, 10);
    two.height = parseInt(height, 10);
    two.trigger("resize");
  }

  function getCurrentWord() {
    const numWords = words.length;
    const segmentAngle = TAU / numWords;
    const currAngle = (TAU + PI / 2 - group.rotation + segmentAngle / 2) % TAU;

    return words.find((_, i) => segmentAngle * (i + 1) > currAngle);
  }

  function initEvents() {
    const domElement = two.renderer.domElement;

    Object.keys(eventMap).map((type) =>
      domElement.addEventListener(type, eventMap[type])
    );
  }

  function removeEvents() {
    const domElement = two.renderer.domElement;

    two.unbind("update");

    Object.keys(eventMap).map((type) =>
      domElement.removeEventListener(type, eventMap[type])
    );
  }

  function destroyPaths() {
    group.remove.apply(group, group.children);
    two.clear();
  }

  function destroy() {
    destroyPaths();
    removeEvents();

    return true;
  }

  return {
    destroy,
    drawWheel,
    getCurrentWord,
    init,
    setWords,
    spin,
    updateDims,
  };
};

// DOM
const mount = document.querySelector(".js-mount");
const wordButton = document.querySelector(".js-get-word");
const spinButton = document.querySelector(".js-spin");
const wordsInput = document.querySelector(".js-words");
const getWords = () => wordsInput.value.split(" ");

wordsInput.addEventListener("input", handleChange);
wordButton.addEventListener("click", handleGetWord);
spinButton.addEventListener("click", handleSpin);

const wheel = wheelFactory(mount);
wheel.init({
  width: Math.min(window.innerWidth, window.innerHeight),
  height: Math.min(window.innerWidth, window.innerHeight),
  onWheelTick: () => console.log("tick"),
});
wheel.setWords(getWords());
wheel.drawWheel();

function handleChange(e) {
  const { target } = e;
  const words = target.value.split(" ");

  wheel.setWords(words);
  wheel.drawWheel();
}

function handleGetWord(e) {
  const word = wheel.getCurrentWord();

  e.target.textContent = `Get current word: ${word}`;
  console.log(word);
}

function handleSpin() {
  wheel.spin(Math.random());
}

window.addEventListener("resize", () => {
  wheel.updateDims({
    width: Math.min(window.innerWidth, window.innerHeight),
    height: Math.min(window.innerWidth, window.innerHeight),
  });
});

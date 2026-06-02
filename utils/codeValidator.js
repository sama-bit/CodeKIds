/**
 * Code Validator + Maze Simulator
 * Handles both text-based validation and actual maze movement simulation.
 */

// ─────────────────────────────────────────────
//  MAZE SIMULATOR
// ─────────────────────────────────────────────

/**
 * Parse user code (SCRATCH/PYTHON style) into a flat list of move steps.
 * Returns { steps: [{action}], error: string|null }
 *
 * Supported actions: go_forward, move_up, move_down, move_right, move_left,
 *                    turn_right, turn_left, repeat(n, fn), if/else
 */
const parseAndSimulate = (code, levelData) => {
  if (!levelData || !levelData.gridMap) {
    return { steps: [], reachedGoal: false, hitWall: false, error: 'No grid data' };
  }

  const {
    gridMap,
    gridRows,
    gridCols,
    startPosition,
    startDirection,
    goalPosition,
  } = levelData;

  // State
  let row = startPosition.row;
  let col = startPosition.col;
  let dir = startDirection || 'right'; // right | left | up | down
  const steps = [];
  let hitWall = false;
  let reachedGoal = false;
  const MAX_STEPS = 200;

  const isWall = (r, c) => {
    if (r < 0 || r >= gridRows || c < 0 || c >= gridCols) return true;
    return gridMap[r][c] === 1;
  };

  const isGoal = (r, c) => r === goalPosition.row && c === goalPosition.col;

  const directionDelta = {
    right: { dr: 0, dc: 1 },
    left:  { dr: 0, dc: -1 },
    up:    { dr: -1, dc: 0 },
    down:  { dr: 1, dc: 0 },
  };

  const addStep = (action, fromRow, fromCol, toRow, toCol, facing, blocked) => {
    steps.push({ action, fromRow, fromCol, toRow, toCol, facing, blocked });
  };

  // ---- Action executors ----

  const doGoForward = () => {
    if (steps.length >= MAX_STEPS) return;
    const { dr, dc } = directionDelta[dir];
    const nr = row + dr;
    const nc = col + dc;
    if (isWall(nr, nc)) {
      addStep('go_forward', row, col, row, col, dir, true);
      hitWall = true;
    } else {
      addStep('go_forward', row, col, nr, nc, dir, false);
      row = nr;
      col = nc;
      if (isGoal(row, col)) reachedGoal = true;
    }
  };

  const doMoveDir = (moveDir) => {
    if (steps.length >= MAX_STEPS) return;
    const { dr, dc } = directionDelta[moveDir];
    const nr = row + dr;
    const nc = col + dc;
    if (isWall(nr, nc)) {
      addStep(moveDir, row, col, row, col, dir, true);
      hitWall = true;
    } else {
      addStep(moveDir, row, col, nr, nc, dir, false);
      row = nr;
      col = nc;
      if (isGoal(row, col)) reachedGoal = true;
    }
  };

  const doTurnRight = () => {
    const turns = { right: 'down', down: 'left', left: 'up', up: 'right' };
    dir = turns[dir];
    addStep('turn_right', row, col, row, col, dir, false);
  };

  const doTurnLeft = () => {
    const turns = { right: 'up', up: 'left', left: 'down', down: 'right' };
    dir = turns[dir];
    addStep('turn_left', row, col, row, col, dir, false);
  };

  const pathClear = () => {
    const { dr, dc } = directionDelta[dir];
    return !isWall(row + dr, col + dc);
  };

  // ---- Code interpreter ----
  // We run the solution / submitted code in a safe sandboxed context.

  try {
    const sandbox = {
      go_forward:  () => doGoForward(),
      move_right:  () => doMoveDir('right'),
      move_left:   () => doMoveDir('left'),
      move_up:     () => doMoveDir('up'),
      move_down:   () => doMoveDir('down'),
      turn_right:  () => doTurnRight(),
      turn_left:   () => doTurnLeft(),
      path_clear:  () => pathClear(),
      path_is_clear: () => pathClear(),
      obstacle_ahead: () => !pathClear(),
      at_goal:     () => isGoal(row, col),
      item_ahead:  () => false,
      collect_item: () => {},
      show_score:  () => {},
      show_star:   () => {},
      onclick:     (fn) => { try { fn(); } catch(e) {} },
      on_reach:    (_name, fn) => { if (reachedGoal) { try { fn(); } catch(e) {} } },
      repeat: (n, fn) => {
        const count = Math.min(parseInt(n) || 0, 100);
        for (let i = 0; i < count; i++) {
          if (steps.length >= MAX_STEPS) break;
          try { fn(); } catch(e) {}
        }
      },
      // Python style 'do(direction)' — note: 'do' is a reserved word, so we alias it
      do_move: (direction) => {
        const map = { right: 'right', left: 'left', up: 'up', down: 'down',
                      forward: null };
        if (map[direction] !== undefined) {
          if (map[direction]) doMoveDir(map[direction]);
          else doGoForward();
        }
      },
      move_forward: () => doGoForward(),
    };

    // Transpile Python-ish syntax to JS before eval
    let jsCode = transpilePythonToJS(code);

    // Build function body with sandbox bindings
    // Note: 'do' is a reserved word so we handle it via a rename
    const fnBody = Object.keys(sandbox)
      .map(k => `const ${k} = __sb.${k};`)
      .join('\n') 
      + '\nconst do_fn = __sb.do_move;\n'
      + jsCode;

    // eslint-disable-next-line no-new-func
    const fn = new Function('__sb', fnBody);
    fn(sandbox);

  } catch (err) {
    // Syntax or runtime error in user code — not a crash, just wrong code
    return { steps, reachedGoal, hitWall, error: err.message };
  }

  return { steps, reachedGoal, hitWall, error: null };
};

/**
 * Very lightweight Python→JS transpiler for the maze commands we support.
 * Handles: for i in range(n), if/else blocks, while, def/call, indentation.
 */
const transpilePythonToJS = (code) => {
  if (!code) return '';

  // If code already looks like JS (has semicolons, braces, or arrows) return as-is
  if (/[{};]/.test(code) || /=>/.test(code)) return code;

  // Replace Python do(x) with do_fn(x) to avoid JS reserved word
  code = code.replace(/\bdo\s*\(/g, 'do_fn(');

  const lines = code.split('\n');
  const output = [];
  const indentStack = [0];

  const closeBlocks = (currentIndent) => {
    while (indentStack.length > 1 && indentStack[indentStack.length - 1] > currentIndent) {
      indentStack.pop();
      output.push('}');
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimEnd();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;
    closeBlocks(indent);

    const t = trimmed.trim();

    // for i in range(n):
    const forRange = t.match(/^for\s+\w+\s+in\s+range\((\d+)\)\s*:/);
    if (forRange) {
      output.push(`for (let __i = 0; __i < ${forRange[1]}; __i++) {`);
      indentStack.push(indent + 1);
      continue;
    }

    // for move in path:  /  for move in moves:
    const forList = t.match(/^for\s+(\w+)\s+in\s+(\w+)\s*:/);
    if (forList) {
      output.push(`for (const ${forList[1]} of (${forList[2]} || [])) {`);
      indentStack.push(indent + 1);
      continue;
    }

    // while not at_goal():  /  while ...:
    const whileMatch = t.match(/^while\s+(.+)\s*:/);
    if (whileMatch) {
      let cond = whileMatch[1].trim();
      cond = cond.replace(/\bnot\s+/g, '!');
      cond = cond.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||');
      output.push(`let __wlimit = 0; while ((${cond}) && ++__wlimit < 200) {`);
      indentStack.push(indent + 1);
      continue;
    }

    // if not obstacle_ahead():  /  if path_is_clear():
    const ifMatch = t.match(/^if\s+(.+)\s*:/);
    if (ifMatch) {
      let cond = ifMatch[1].trim();
      cond = cond.replace(/\bnot\s+/g, '!');
      cond = cond.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||');
      output.push(`if (${cond}) {`);
      indentStack.push(indent + 1);
      continue;
    }

    // else:
    if (t === 'else:') {
      // close current if block, open else
      if (output[output.length - 1] === '}') {
        output[output.length - 1] = '} else {';
      } else {
        output.push('} else {');
      }
      indentStack.push(indent + 1);
      continue;
    }

    // def funcname():
    const defMatch = t.match(/^def\s+(\w+)\s*\(\s*\)\s*:/);
    if (defMatch) {
      output.push(`function ${defMatch[1]}() {`);
      indentStack.push(indent + 1);
      continue;
    }

    // variable assignment  x = 0  /  x = x + 3
    const assignMatch = t.match(/^(\w+)\s*=\s*(.+)$/);
    if (assignMatch && !t.includes('(')) {
      output.push(`let ${assignMatch[1]} = ${assignMatch[2]};`);
      continue;
    }

    // list literal  moves = ["right", "down"]
    const listMatch = t.match(/^(\w+)\s*=\s*\[(.+)\]$/);
    if (listMatch) {
      output.push(`let ${listMatch[1]} = [${listMatch[2]}];`);
      continue;
    }

    // plain call  move_right()  /  do(move)
    output.push(t.endsWith(')') ? `${t};` : t);
  }

  closeBlocks(0);
  return output.join('\n');
};

// ─────────────────────────────────────────────
//  STEP-BY-STEP SIMULATION API
// ─────────────────────────────────────────────

/**
 * Run simulation and return all steps for frontend animation.
 * Frontend plays them one by one.
 */
const simulateMovement = (code, levelData) => {
  const result = parseAndSimulate(code, levelData);
  return {
    steps: result.steps,
    reachedGoal: result.reachedGoal,
    hitWall: result.hitWall,
    totalSteps: result.steps.length,
    error: result.error,
    finalPosition: result.steps.length > 0
      ? { row: result.steps[result.steps.length - 1].toRow,
          col: result.steps[result.steps.length - 1].toCol }
      : levelData.startPosition,
  };
};

// ─────────────────────────────────────────────
//  TEXT / CODE VALIDATOR
// ─────────────────────────────────────────────

const validateMission = (code, validator, simulationResult) => {
  if (!validator || !code) return false;

  const lowerCode = code.toLowerCase();

  // reach_goal — only passes if simulation says so
  if (validator === 'reach_goal') {
    // If we have simulation data, use it
    if (simulationResult !== undefined) return simulationResult.reachedGoal === true;
    // Fallback (HTML levels): keep old behaviour
    return false;
  }

  // no_collision — only passes if simulation ran without hitting a wall
  if (validator === 'no_collision') {
    if (simulationResult !== undefined) return simulationResult.hitWall === false;
    return false;
  }

  // all_items_collected
  if (validator === 'all_items_collected') {
    if (simulationResult !== undefined) return simulationResult.reachedGoal === true;
    return false;
  }

  // correct_structure — HTML levels, text check only
  if (validator === 'correct_structure') return true;

  // img_inside_section
  if (validator === 'img_inside_section') {
    const sectionIdx = lowerCode.indexOf('<section');
    const imgIdx = lowerCode.indexOf('<img');
    const closeSectionIdx = lowerCode.indexOf('</section>');
    return sectionIdx !== -1 && imgIdx > sectionIdx && imgIdx < closeSectionIdx;
  }

  // function_call_exists
  if (validator === 'function_call_exists') {
    const defMatch = code.match(/def\s+(\w+)\s*\(/);
    if (!defMatch) return false;
    const fnName = defMatch[1];
    const callPattern = new RegExp(`${fnName}\\s*\\(`, 'g');
    const matches = code.match(callPattern);
    return matches && matches.length >= 2;
  }

  // contains:keyword
  if (validator.startsWith('contains:')) {
    const keyword = validator.replace('contains:', '');
    return lowerCode.includes(keyword.toLowerCase());
  }

  // contains_both:keyword1,keyword2
  if (validator.startsWith('contains_both:')) {
    const keywords = validator.replace('contains_both:', '').split(',');
    return keywords.every((kw) => lowerCode.includes(kw.trim().toLowerCase()));
  }

  // contains_any_tag:tag1,tag2
  if (validator.startsWith('contains_any_tag:')) {
    const tags = validator.replace('contains_any_tag:', '').split(',');
    return tags.some((tag) => lowerCode.includes(`<${tag.trim()}`));
  }

  // contains_tag:tagname
  if (validator.startsWith('contains_tag:')) {
    const tag = validator.replace('contains_tag:', '').trim();
    return lowerCode.includes(`<${tag}`);
  }

  // count_tag:tagname:N
  if (validator.startsWith('count_tag:')) {
    const parts = validator.replace('count_tag:', '').split(':');
    const tag = parts[0].trim();
    const minCount = parseInt(parts[1], 10);
    const regex = new RegExp(`<${tag}[\\s>]`, 'gi');
    const matches = lowerCode.match(regex);
    return matches && matches.length >= minCount;
  }

  return false;
};

/**
 * Validate all missions for a level.
 * For SCRATCH and PYTHON levels that have a gridMap, runs simulation first.
 * For HTML levels, runs text-based validation only.
 */
const validateSubmission = (code, missions, levelData) => {
  const completedMissions = [];
  const failedMissions = [];

  // Run simulation once for maze levels
  let simulationResult = null;
  let simulationSteps = [];

  const hasMaze = levelData && levelData.gridMap && levelData.category !== 'HTML';

  if (hasMaze) {
    const sim = simulateMovement(code, levelData);
    simulationResult = sim;
    simulationSteps = sim.steps;
  }

  for (const mission of missions) {
    const passed = validateMission(code, mission.validator, simulationResult);
    if (passed) {
      completedMissions.push(mission.id);
    } else {
      failedMissions.push(mission.id);
    }
  }

  const allPassed = failedMissions.length === 0;

  return {
    allPassed,
    completedMissions,
    failedMissions,
    completionPercentage: Math.round((completedMissions.length / missions.length) * 100),
    // Include simulation data so frontend can animate
    simulation: simulationResult
      ? {
          steps: simulationSteps,
          reachedGoal: simulationResult.reachedGoal,
          hitWall: simulationResult.hitWall,
          totalSteps: simulationResult.totalSteps,
          finalPosition: simulationResult.finalPosition,
        }
      : null,
  };
};

/**
 * Calculate stars based on attempts
 */
const calculateStars = (attempts, thresholds) => {
  if (attempts <= thresholds.threeStar) return 3;
  if (attempts <= thresholds.twoStar) return 2;
  return 1;
};

module.exports = {
  validateSubmission,
  validateMission,
  calculateStars,
  simulateMovement,
  transpilePythonToJS,
};

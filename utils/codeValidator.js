/**
 * Code Validator
 * Validates user-submitted code against mission rules.
 * Each mission has a `validator` string that tells us what to check.
 */

const validateMission = (code, validator) => {
  if (!validator || !code) return false;

  const lowerCode = code.toLowerCase();

  // reach_goal - always true when submitted (game simulation handles this)
  if (validator === 'reach_goal') return true;

  // all_items_collected
  if (validator === 'all_items_collected') return true;

  // no_collision
  if (validator === 'no_collision') return true;

  // correct_structure
  if (validator === 'correct_structure') return true;

  // img_inside_section
  if (validator === 'img_inside_section') {
    const sectionIdx = lowerCode.indexOf('<section');
    const imgIdx = lowerCode.indexOf('<img');
    const closeSectionIdx = lowerCode.indexOf('</section>');
    return sectionIdx !== -1 && imgIdx > sectionIdx && imgIdx < closeSectionIdx;
  }

  // function_call_exists - check that a def exists and is also called
  if (validator === 'function_call_exists') {
    const defMatch = code.match(/def\s+(\w+)\s*\(/);
    if (!defMatch) return false;
    const fnName = defMatch[1];
    const callPattern = new RegExp(`${fnName}\\s*\\(`, 'g');
    const matches = code.match(callPattern);
    // Must appear at least twice (once for def, once for call)
    return matches && matches.length >= 2;
  }

  // contains:keyword - check if code contains keyword
  if (validator.startsWith('contains:')) {
    const keyword = validator.replace('contains:', '');
    return lowerCode.includes(keyword.toLowerCase());
  }

  // contains_both:keyword1,keyword2 - check both are present
  if (validator.startsWith('contains_both:')) {
    const keywords = validator.replace('contains_both:', '').split(',');
    return keywords.every((kw) => lowerCode.includes(kw.trim().toLowerCase()));
  }

  // contains_any_tag:tag1,tag2 - contains at least one of these HTML tags
  if (validator.startsWith('contains_any_tag:')) {
    const tags = validator.replace('contains_any_tag:', '').split(',');
    return tags.some((tag) => lowerCode.includes(`<${tag.trim()}`));
  }

  // contains_tag:tagname - check for HTML tag
  if (validator.startsWith('contains_tag:')) {
    const tag = validator.replace('contains_tag:', '').trim();
    return lowerCode.includes(`<${tag}`);
  }

  // count_tag:tagname:N - check that tag appears at least N times
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
 * Validate all missions in a level
 * Returns which missions were completed
 */
const validateSubmission = (code, missions) => {
  const completedMissions = [];
  const failedMissions = [];

  for (const mission of missions) {
    const passed = validateMission(code, mission.validator);
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

module.exports = { validateSubmission, validateMission, calculateStars };

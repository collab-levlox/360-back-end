const { Parser } = require("expr-eval");
const moment = require("moment");


const modalFormatCheck = ({ modal = {}, extraModal = {} }) => {
  const merged = { ...modal, ...extraModal };

  const seenKeys = new Set();

  const createError = (message, correction = null) => {
    const error = new Error(message);
    error.name = "ModalValidationError";
    error.correction = correction;
    throw error;
  };

  Object.keys(merged).forEach((stepKey) => {
    const item = merged[stepKey];
    const rawKey = item.key || "";

    if (!rawKey.trim()) {
      createError(`Key is empty in step "${stepKey}".`, "Provide a valid key.");
    }

    if (/\s/.test(rawKey)) {
      createError(
        `Key "${rawKey}" contains spaces.`,
        `Use underscores or camelCase instead of spaces (e.g. "${rawKey.replace(
          /\s+/g,
          "_"
        )}")`
      );
    }

    if (seenKeys.has(rawKey)) {
      createError(
        `Duplicate key found: "${rawKey}".`,
        "Ensure each key is unique across modal and extraModal."
      );
    }
    seenKeys.add(rawKey);

    if (item.type === "formula") {
      if (!item.value) {
        createError(
          `Formula field "${rawKey}" has no valid expression.`,
          "Provide a valid formula string (e.g., 'a + b')."
        );
      }
      if (isValidNumber(item.value)) {
        return;
      }

      try {
        const parser = new Parser();
        parser.parse(item.value);
      } catch (err) {
        createError(
          `Invalid formula in "${rawKey}".`,
          `Check syntax of "${item.value}". Example: 'a + b * 2'`
        );
      }
    }
  });

  return true;
};

const updateFormulaFieldWithAmount = ({ modal = null, extraModal = null }) => {
  const validate = modalFormatCheck({ modal, extraModal });
  if (!validate) {
    throw new Error("Invalid modal format");
  }
  const response = JSON.parse(JSON.stringify(modal));

  let formulaEvaluateData = {};

  const normalize = (modalSource) => {
    Object.keys(modalSource || {}).forEach((stepKey) => {
      const item = modalSource[stepKey];
      const itemKey = item.key.trim();
      formulaEvaluateData[itemKey] = item.value;
    });
  };

  normalize(modal);
  normalize(extraModal);

  Object.keys(response).forEach((stepKey) => {
    const item = response[stepKey];
    if (item.type === "formula") {
      try {
        // if (typeof item.value != "string" && isValidNumber(item.value)) {
        //   return;
        // }
        // console.log(item.value, "item.value");

        // const parser = new Parser();
        // const expr = parser.parse(item.value);

        // console.log(formulaEvaluateData, "formulaEvaluateData");

        // const result = expr.evaluate(formulaEvaluateData);

        // response[stepKey].value = result;

        if (typeof item.value !== "string" && isValidNumber(item.value)) {
          return;
        }

        const parser = new Parser();
        const expr = parser.parse(item.value);
        const vars = expr.variables();

        // check if all required variables exist in formulaEvaluateData
        const missing = vars.filter(
          (v) =>
            formulaEvaluateData[v] === undefined ||
            typeof formulaEvaluateData[v] === "string"
        );

        if (missing.length > 0) {
          unresolved = true;
          return;
        }

        // all dependencies are numbers, safe to evaluate
        const result = expr.evaluate(formulaEvaluateData);

        response[stepKey].value = result;
        formulaEvaluateData[item.key] = result; // update cache
      } catch (err) {
        // ❌ Instead of hiding, show meaningful error
        throw new Error(
          `Formula error in "${item.key}": ${err.message}. Formula: ${item.value}`
        );
      }
    }
  });

  return response;
};

function resolveFormulas(data) {
  const parser = new Parser();
  const resolved = { ...data };

  let changed = true;
  while (changed) {
    changed = false;

    for (const [key, value] of Object.entries(resolved)) {
      if (typeof value === "string") {
        try {
          const expr = parser.parse(value);
          const vars = expr.variables();

          // check if all variables exist and are numbers
          if (vars.every((v) => typeof resolved[v] === "number")) {
            resolved[key] = expr.evaluate(resolved);
            changed = true;
          }
        } catch (err) {
          console.error("Parse error:", key, value, err.message);
        }
      }
    }
  }

  return resolved;
}

function isValidNumber(value) {
  if (value === null || value === undefined || value === "") return false;
  // Matches integers or decimals, optional leading +/-
  return /^-?\d+(\.\d+)?$/.test(String(value).trim());
}

const generateSlotByTime = ({start, end}) => {
  let slot = [];

  const startTime = moment(start, "HH:mm A");
  const endTime = moment(end, "HH:mm A");
  
  while (startTime.isBefore(endTime)) {
    const slotStart = startTime.format("HH:mm A");
    startTime.add(1,'hours');
    const slotEnd = startTime.format("HH:mm A");
    slot.push({ start: slotStart, end: slotEnd });
  }
  return slot;
}


function capitalizeWords(str) {
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}


module.exports = {
  capitalizeWords,
  updateFormulaFieldWithAmount,
  modalFormatCheck,
  isValidNumber,
  generateSlotByTime
};

// Example usage

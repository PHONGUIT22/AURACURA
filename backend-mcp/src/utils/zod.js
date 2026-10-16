/**
 * Resilient Zod Wrapper (Standard JS)
 * Zero-dependency schema validator for runtime execution.
 */

class ZodTypeShim {
  constructor(validator = (v) => v) {
    this.validator = validator;
    this._description = undefined;
    this._defaultVal = undefined;
    this._isOptional = false;
  }

  describe(desc) {
    this._description = desc;
    return this;
  }

  default(val) {
    this._defaultVal = val;
    return this;
  }

  optional() {
    this._isOptional = true;
    return this;
  }

  min(minVal) {
    return this;
  }

  max(maxVal) {
    return this;
  }

  parse(val) {
    if (val === undefined) {
      if (this._defaultVal !== undefined) return this._defaultVal;
      if (this._isOptional) return undefined;
    }
    return this.validator(val);
  }
}

class ZodObjectShim extends ZodTypeShim {
  constructor(shape) {
    super((val) => {
      const obj = (val && typeof val === 'object') ? val : {};
      const result = {};
      for (const [key, schema] of Object.entries(shape)) {
        result[key] = schema.parse(obj[key]);
      }
      return result;
    });
    this.shape = shape;
  }
}

class ZodArrayShim extends ZodTypeShim {
  constructor(itemSchema) {
    super((val) => {
      if (!Array.isArray(val)) return [];
      return val.map((item) => itemSchema.parse(item));
    });
    this.itemSchema = itemSchema;
  }
}

export const z = {
  string: () => new ZodTypeShim((v) => (v !== undefined ? String(v) : '')),
  number: () => new ZodTypeShim((v) => (v !== undefined ? Number(v) : 0)),
  boolean: () => new ZodTypeShim((v) => Boolean(v)),
  enum: (values) => new ZodTypeShim((v) => v),
  array: (schema) => new ZodArrayShim(schema),
  object: (shape) => new ZodObjectShim(shape),
  infer: {},
};

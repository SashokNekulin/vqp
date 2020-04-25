/**
 * Сообщения об ошибках по умолчанию.
 *
 * @private
 */

const Messages = {
  // Type message
  type(prop, ctx, type) {
    if (typeof type == 'function') {
      type = type.name;
    }

    return `${prop} должно быть по типу ${type}.`;
  },

  // Required message
  required(prop) {
    return `${prop} обязательный параметр.`;
  },

  // Match message
  match(prop, ctx, regexp) {
    return `${prop} должен соответствовать ${regexp}.`;
  },

  // Length message
  length(prop, ctx, len) {
    if (typeof len == 'number') {
      return `${prop} должен иметь длину ${len}.`;
    }

    const { min, max } = len;

    if (min && max) {
      return `${prop} должен иметь длину между ${min} и ${max}.`;
    }
    if (max) {
      return `${prop} должен иметь максимальную длину ${max}.`;
    }
    if (min) {
      return `${prop} должен иметь минимальную длину ${min}.`;
    }
  },

  // Size message
  size(prop, ctx, size) {
    if (typeof size == 'number') {
      return `${prop} должен иметь размер ${size}.`;
    }

    const { min, max } = size;

    if (min !== undefined && max !== undefined) {
      return `${prop} должно быть между ${min} и ${max}.`;
    }
    if (max !== undefined) {
      return `${prop} должно быть меньше чем ${max}.`;
    }
    if (min !== undefined) {
      return `${prop} должно быть больше чем ${min}.`;
    }
  },

  // Enum message
  enum(prop, ctx, enums) {
    const copy = enums.slice();
    const last = copy.pop();
    return `${prop} должно быть либо ${copy.join(', ')} или ${last}.`;
  },

  // Illegal property
  illegal(prop) {
    return `${prop} не допускается.`;
  },

  // Default message
  default(prop) {
    return `Проверка не удалась для ${prop}.`;
  }
};

export default Messages;

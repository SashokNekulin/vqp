/**
 * Сообщения об ошибках по умолчанию.
 *
 * @private
 */

const Messages = {
  // Сообщение если не соотведствует типу
  type(prop, ctx, type) {
    if (typeof type == 'function') {
      type = type.name;
    }

    return `${prop} должно быть по типу ${type}.`;
  },

  // Сообщение если не передан обязательный параметр
  required(prop) {
    return `${prop} обязательный параметр.`;
  },

  // Сообщение если не соотведствует регулярному вырожению
  match(prop, ctx, regexp) {
    return `${prop} должен соответствовать ${regexp}.`;
  },

  // Сообщение если не соотведствует длинне
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

  // Сообщение если не соотведствует размеру
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

  // Сообщение если не соотведствует перечеслению
  enum(prop, ctx, enums) {
    const copy = enums.slice();
    const last = copy.pop();
    return `${prop} должно быть либо ${copy.join(', ')} или ${last}.`;
  },

  // Сообщение если не соотведствует схеме
  illegal(prop) {
    return `${prop} не допускается.`;
  },

  // Сообщение по умолчанию
  default(prop) {
    return `Проверка не удалась для ${prop}.`;
  }
};

export default Messages;

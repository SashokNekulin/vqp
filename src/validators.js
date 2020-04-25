import typeOf from 'component-type';

/**
 * Стандартные валидаторы.
 *
 * @private
 */

const Validators = {
  /**
   * Подтверждает присутствие.
   *
   * @param {Mixed} value - проверяемое значение
   * @param {Object} ctx - проверяемый объект
   * @param {Bolean} required
   * @return {Boolean}
   */

  required(value, ctx, required) {
    if (required === false) return true;
    return value != null && value !== '';
  },

  /**
   * Проверяет тип.
   *
   * @param {Mixed} value - проверяемое значение
   * @param {Object} ctx - проверяемый объект
   * @param {String|Function} name имя типа или конструктора
   * @return {Boolean}
   */

  type(value, ctx, name) {
    if (value == null) return true;

    if (typeof name == 'function') {
      return value.constructor === name;
    }

    return typeOf(value) === name;
  },

  /**
   * Проверяет длину.
   *
   * @param {String} value проверяемая строка
   * @param {Object} ctx проверяемый объект
   * @param {Object|Number} rules Объект с .min и/или .max свойством или число
   * @param {Number} [rules.min] - минимальная длина
   * @param {Number} [rules.max] - максимальная длина
   * @return {Boolean}
   */

  length(value, ctx, len) {
    if (value == null) return true;
    if (typeof len == 'number') {
      return value.length === len;
    }
    const { min, max } = len;
    if (min && value.length < min) return false;
    if (max && value.length > max) return false;
    return true;
  },

  /**
   * Проверяет размер.
   *
   * @param {Number} value проверяемый номер
   * @param {Object} ctx проверяемый объект
   * @param {Object|Number} size Объект with .min and/or .max свойством или число
   * @param {String|Number} [size.min] - минимальный размер
   * @param {String|Number} [size.max] - максимальный размер
   * @return {Boolean}
   */

  size(value, ctx, size) {
    if (value == null) return true;
    if (typeof size == 'number') {
      return value === size;
    }
    const { min, max } = size;
    if (parseInt(min) != null && value < min) return false;
    if (parseInt(max) != null && value > max) return false;
    return true;
  },

  /**
   * Проверяет перечисления.
   *
   * @param {String} value проверяемая строка
   * @param {Object} ctx проверяемый объект
   * @param {Array} enums массив с допустимыми значениями
   * @return {Boolean}
   */

  enum(value, ctx, enums) {
    if (value == null) return true;
    return enums.includes(value);
  },

  /**
   * Проверяет соответствие заданному регулярному выражению.
   *
   * @param {String} value проверяемая строка
   * @param {Object} ctx проверяемый объект
   * @param {RegExp} regexp регулярное выражение для проверки
   * @return {Boolean}
   */

  match(value, ctx, regexp) {
    if (value == null) return true;
    return regexp.test(value);
  }
};

export default Validators;

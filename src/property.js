import ValidationError from './error';
import { join } from './utils';

/**
 * Экземпляр свойства возвращается при каждом вызове `schema.path()`.
 * Свойства также создаются внутри, когда объект передается конструктору схемы.
 *
 * @param {String} name - название свойства
 * @param {Schema} schema - вложеная схема
 */

export default class Property {
  constructor(name, schema) {
    this.name = name;
    this.registry = {};
    this._schema = schema;
    this._type = null;
    this.messages = {};
  }

  /**
   * Регистрирует сообщения.
   *
   * @example
   * prop.message('что-то не так')
   * prop.message({ required: 'параметр обязателен.' })
   *
   * @param {Object|String} messages
   * @return {Property}
   */

  message(messages) {
    if (typeof messages == 'string') {
      messages = { default: messages };
    }

    const entries = Object.entries(messages);

    for (const [key, val] of entries) {
      this.messages[key] = val;
    }

    return this;
  }

  /**
   * Смонтировать заданную схему на текущем пути.
   *
   * @example
   * const user = new Schema({ email: String })
   * prop.schema(user)
   *
   * @param {Schema} schema - схема для монтирования
   * @return {Property}
   */

  schema(schema) {
    this._schema.path(this.name, schema);
    return this;
  }

  /**
   * Проверка с использованием именованных функций из данного объекта.
   * Сообщения об ошибках можно определить, предоставив объекту
   * именованные сообщения об ошибках / генераторы для `schema.message()`
   *
   * Генератор сообщений получает проверяемое значение,
   * объект, к которому он принадлежит, и любые дополнительные аргументы.
   *
   * @example
   * const schema = new Schema()
   * const prop = schema.path('some.path')
   *
   * schema.message({
   *   binary: (path, ctx) => `${path} must be binary.`,
   *   bits: (path, ctx, bits) => `${path} must be ${bits}-bit`
   * })
   *
   * prop.use({
   *   binary: (val, ctx) => /^[01]+$/i.test(val),
   *   bits: [(val, ctx, bits) => val.length == bits, 32]
   * })
   *
   * @param {Object} fns - объект с именованными функциями проверки для вызова
   * @return {Property}
   */

  use(fns) {
    Object.keys(fns).forEach(name => {
      let arr = fns[name];
      if (!Array.isArray(arr)) arr = [arr];
      const fn = arr.shift();
      this._register(name, arr, fn);
    });

    return this;
  }

  /**
   * Регистрирует валидатор, который проверяет наличие.
   *
   * @example
   * prop.required()
   *
   * @param {Boolean} [bool] - `true` если требуется,` false` в противном случае
   * @return {Property}
   */

  required(bool = true) {
    return this._register('required', [bool]);
  }

  /**
   * Регистрирует валидатор, который проверяет, имеет ли значение заданный тип
   *
   * @example
   * prop.type(String)
   *
   * @example
   * prop.type('string')
   *
   * @param {String|Function} type - тип для проверки
   * @return {Property}
   */

  type(type) {
    this._type = type;
    return this._register('type', [type]);
  }

  /**
   * Удобный метод для установки типа в `String`
   *
   * @example
   * prop.string()
   *
   * @return {Property}
   */

  string() {
    return this.type(String);
  }

  /**
   * Удобный метод для установки типа на `Number`
   *
   * @example
   * prop.number()
   *
   * @return {Property}
   */

  number() {
    return this.type(Number);
  }

  /**
   * Удобный метод для установки типа в `Array`
   *
   * @example
   * prop.array()
   *
   * @return {Property}
   */

  array() {
    return this.type(Array);
  }

  /**
   * Удобный метод для установки типа на `Date`
   *
   * @example
   * prop.date()
   *
   * @return {Property}
   */

  date() {
    return this.type(Date);
  }

  /**
   * Регистрирует валидатор, который проверяет длину.
   *
   * @example
   * prop.length({ min: 8, max: 255 })
   * prop.length(10)
   *
   * @param {Object|Number} rules - ОбЪект с `.min` и `.max` свойствами или Number
   * @param {Number} rules.min - минимальная длина
   * @param {Number} rules.max - максимальная длина
   * @return {Property}
   */

  length(rules) {
    return this._register('length', [rules]);
  }

  /**
   * Регистрирует валидатор, который проверяет размер.
   *
   * @example
   * prop.size({ min: 8, max: 255 })
   * prop.size(10)
   *
   * @param {Object|Number} rules - ОбЪект с `.min` и `.max` свойствами или Number
   * @param {Number} rules.min - минимальный размер
   * @param {Number} rules.max - максимальный размер
   * @return {Property}
   */

  size(rules) {
    return this._register('size', [rules]);
  }

  /**
   * Регистрирует валидатор для перечислений.
   *
   * @example
   * prop.enum(['cat', 'dog'])
   *
   * @param {Array} rules - допустимые значения
   * @return {Property}
   */

  enum(enums) {
    return this._register('enum', [enums]);
  }

  /**
   * Регистрирует валидатор, который проверяет, соответствует ли значение заданному `regexp`.
   *
   * @example
   * prop.match(/some\sregular\sexpression/)
   *
   * @param {RegExp} regexp - регулярное выражение для соответствия
   * @return {Property}
   */

  match(regexp) {
    return this._register('match', [regexp]);
  }

  /**
   * Регистрирует валидатор, который проверяет каждое значение в массиве на соответствие заданным «правилам».
   *
   * @example
   * prop.each({ type: String })
   * prop.each([{ type: Number }])
   * prop.each({ things: [{ type: String }]})
   * prop.each(schema)
   *
   * @param {Array|Object|Schema|Property} rules - правила использования
   * @return {Property}
   */

  each(rules) {
    this._schema.path(join('$', this.name), rules);
    return this;
  }

  /**
   * Регистрирует пути для элементов массива в родительской схеме с заданным массивом правил.
   *
   * @example
   * prop.elements([{ type: String }, { type: Number }])
   *
   * @param {Array} arr - массив правил для использования
   * @return {Property}
   */

  elements(arr) {
    arr.forEach((rules, i) => {
      this._schema.path(join(i, this.name), rules);
    });
    return this;
  }

  /**
   * Регистрирует все свойства данного объекта как вложенные свойства
   *
   * @example
   * prop.properties({
   *   name: String,
   *   email: String
   * })
   *
   * @param {Object} props - свойства с правилами
   * @return {Property}
   */

  properties(props) {
    for (const [prop, rule] of Object.entries(props)) {
      this._schema.path(join(prop, this.name), rule);
    }
    return this;
  }

  /**
   * Прокси-метод для пути к схеме. Упрощает сцепление свойств.
   *
   * @example
   * schema
   *   .path('name').type(String).required()
   *   .path('email').type(String).required()
   *
   */

  path(...args) {
    return this._schema.path(...args);
  }

  /**
   * Приводит значение к заданому типу
   *
   * @example
   * prop.type(String)
   * prop.typecast(123) // => '123'
   *
   * @param {Mixed} value - значение
   * @return {Mixed}
   */

  typecast(value) {
    const schema = this._schema;
    let type = this._type;

    if (!type) return value;

    if (typeof type == 'function') {
      type = type.name;
    }

    const cast = schema.typecasters[type] ||
      schema.typecasters[type.toLowerCase()];

    if (typeof cast != 'function') {
      throw new Error(`Не удалось приввести к типу: Не известный тип: ${type}.`);
    }

    return cast(value);
  }

  /**
   * Проверка заданного "значения"
   *
   * @example
   * prop.type(Number)
   * assert(prop.validate(2) == null)
   * assert(prop.validate('hello world') instanceof Error)
   *
   * @param {Mixed} value - значение для проверки
   * @param {Object} ctx - объект, содержащий значение
   * @param {String} [path] - путь к проверяемому значению
   * @return {ValidationError}
   */

  validate(value, ctx, path = this.name) {
    const types = Object.keys(this.registry);

    for (const type of types) {
      const err = this._run(type, value, ctx, path);
      if (err) return err;
    }

    return null;
  }

  /**
   * Запустите валидатор с указанным типом
   *
   * @param {String} type - тип валидатора
   * @param {Mixed} value - значение для проверки
   * @param {Object} ctx - объект, содержащий значение
   * @param {String} path - путь проверяемого значения
   * @return {ValidationError}
   * @private
   */

  _run(type, value, ctx, path) {
    if (!this.registry[type]) return;
    const schema = this._schema;
    const { args, fn } = this.registry[type];
    const validator = fn || schema.validators[type];
    const valid = validator(value, ctx, ...args, path);
    if (!valid) return this._error(type, ctx, args, path);
  }

  /**
   * Зарегистрировать валидатор
   *
   * @param {String} type - тип валидатора
   * @param {Array} args - аргумент для передачи в валидатор
   * @param {Function} [fn] - пользовательская функция проверки для вызова
   * @return {Property}
   * @private
   */

  _register(type, args, fn) {
    this.registry[type] = { args, fn };
    return this;
  }

  /**
   * Создать сообщение об ошибке
   *
   * @param {String} type - тип валидатора
   * @param {Object} ctx - объект, содержащий значение
   * @param {Array} args - аргументы для передачи
   * @param {String} path - путь к проверяемому значению
   * @return {ValidationError}
   * @private
   */

  _error(type, ctx, args, path) {
    const schema = this._schema;

    let message = this.messages[type] ||
      this.messages.default ||
      schema.messages[type] ||
      schema.messages.default;

    if (typeof message == 'function') {
      message = message(path, ctx, ...args);
    }

    return new ValidationError(message, path);
  }
}

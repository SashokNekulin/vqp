# validate

Validate object properties in javascript.

## Usage

Определить схему и вызвать `.validate()` с объектом, который вы хотите проверить.
Эта функция возвращает массив ошибок проверки.

```js
import Schema from 'validate'

const user = new Schema({
  username: {
    type: String,
    required: true,
    length: { min: 3, max: 32 }
  },
  pets: [{
    name: {
      type: String
      required: true
    },
    animal: {
      type: String
      enum: ['cat', 'dog', 'cow']
    }
  }],
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    }
    zip: {
      type: String,
      match: /^[0-9]+$/,
      required: true
    }
  }
})

const errors = user.validate(obj)
```

Каждая ошибка имеет `.path`, описывающий полный путь свойства, которое не прошло проверку, и`.message`, описывающий ошибку.

```js
errors[0].path //=> 'address.street'
errors[0].message //=> 'address.street is required.'
```

### Собственные сообщения об ошибках

Вы можете переопределить сообщения об ошибках по умолчанию, передав объект `Schema#message()`.

```js
const post = new Schema({
  title: { required: true }
})

post.message({
  required: (path) => `${path} не может быть пустым.`
})

const [error] = post.validate({})
assert(error.message = 'Название не может быть пустым.')
```

Также возможно определить сообщения для отдельных свойств:

```js
const post = new Schema({
  title: {
    required: true,
    message: 'Название обязательно.'
  }
})
```

И для отдельных валидаторов:

```js
const post = new Schema({
  title: {
    type: String,
    required: true,
    message: {
      type: 'Название должно быть строкой.',
      required: 'Название обязательно.'
    }
  }
})
```

### Вложенность

Объекты и массивы могут быть вложены так глубоко, как вы хотите:

```js
const event = new Schema({
  title: {
    type: String,
    required: true
  },
  participants: [{
    name: String,
    email: {
      type: String,
      required: true
    },
    things: [{
      name: String,
      amount: Number
    }]
  }]
})
```

Массивы могут быть определены неявно, как в примере выше, или явно:

```js
const post = new Schema({
  keywords: {
    type: Array,
    each: { type: String }
  }
})
```

Элементы массива также могут быть определены индивидуально:

```js
const user = new Schema({
  something: {
    type: Array,
    elements: [
      { type: Number },
      { type: String }
    ]
  }
})
```

Вложенность также работает со схемами:

```js
const user = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  }
})

const post = new Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: user
})
```

Если вы думаете, что это должно сработать, то это, вероятно, работает.

#### Naming conflicts

Проверка будет наивно предполагать, что вложенный объект, в котором имена свойств _all_ являются валидаторами, не является вложенным объектом.

```js
const schema = new Schema({
  pet: {
    type: {
      required: true,
      type: String,
      enum: ['cat', 'dog']
    }
  }
});
```

В этом примере свойство `pet.type` будет интерпретироваться как правило`type`, и проверки не будут работать так, как задумано. Чтобы обойти это, мы могли бы использовать более подробное правило `properties`:

```js
const schema = new Schema({
  pet: {
    properties: {
      type: {
        required: true,
        type: String,
        enum: ['cat', 'dog']
      }
    }
  }
});
```

В этом случае свойство `type` для pets.properties\` будет интерпретироваться как вложенное свойство, и проверки будут работать так, как задумано.

### Пользовательские валидаторы

Пользовательские валидаторы могут быть определены путем передачи объекта с именованными валидаторами в `.use`:

```js
const hexColor = val => /^#[0-9a-fA-F]$/.test(val)

const car = new Schema({
  color: {
    type: String,
    use: { hexColor }
  }
})
```

Определите пользовательское сообщение об ошибке для валидатора:

```js
car.message({
  hexColor: path => `${path} должен быть действительным цветом.`
})
```

### Пользовательские типы

Передайте конструктор в `.type` для проверки на соответствие пользовательскому типу:

```js
class Car {}

const user = new Schema({
  car: { type: Car }
})
```

### Цепочка API

Если вы хотите избежать построения больших объектов, вы можете добавить пути к схеме с помощью цепочки API:

```js
const user = new Schema()

user
  .path('username').type(String).required()
  .path('address.zip').type(String).required()
```

Элементы массива могут быть определены с помощью `$` в качестве заполнителя для индексов:

```js
const user = new Schema()
user.path('pets.$').type(String)
```

Это эквивалентно написанию

```js
const user = new Schema({ pets: [{ type: String }]})
```

### Приведение типов

Значения могут быть автоматически переданы перед проверкой.
Чтобы включить приведение типов, передайте объект параметров конструктору `Schema` с параметром typecast, установленным в значение true.

```js
const user = new Schema(definition, { typecast: true })
```

Вы можете переопределить этот параметр, передав опцию `.validate()`.

```js
user.validate(obj, { typecast: false })
```

Чтобы настраивать пользовательские типы, вы можете зарегистрировать собственный тип:

```js
class Car {}

const user = new Schema({
  car: { type: Car }
})

user.typecaster({
  Car: (val) => new Car(val)
})
```

### Property stripping

По умолчанию все значения, не определенные в схеме, будут удалены из объекта.
Установите `.strip = false` на объекте параметров, чтобы отключить это поведение. Это, вероятно, будет изменено в будущей версии.

### Строгий режим

Когда строгий режим включен, свойства, которые не определены в схеме, вызовут ошибку проверки. Установите `.strict = true` для объекта параметров, чтобы включить строгий режим.

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

-   [Property](#property)
    -   [Parameters](#parameters)
    -   [message](#message)
        -   [Parameters](#parameters-1)
        -   [Examples](#examples)
    -   [schema](#schema)
        -   [Parameters](#parameters-2)
        -   [Examples](#examples-1)
    -   [use](#use)
        -   [Parameters](#parameters-3)
        -   [Examples](#examples-2)
    -   [required](#required)
        -   [Parameters](#parameters-4)
        -   [Examples](#examples-3)
    -   [type](#type)
        -   [Parameters](#parameters-5)
        -   [Examples](#examples-4)
    -   [string](#string)
        -   [Examples](#examples-5)
    -   [number](#number)
        -   [Examples](#examples-6)
    -   [array](#array)
        -   [Examples](#examples-7)
    -   [date](#date)
        -   [Examples](#examples-8)
    -   [length](#length)
        -   [Parameters](#parameters-6)
        -   [Examples](#examples-9)
    -   [size](#size)
        -   [Parameters](#parameters-7)
        -   [Examples](#examples-10)
    -   [enum](#enum)
        -   [Parameters](#parameters-8)
        -   [Examples](#examples-11)
    -   [match](#match)
        -   [Parameters](#parameters-9)
        -   [Examples](#examples-12)
    -   [each](#each)
        -   [Parameters](#parameters-10)
        -   [Examples](#examples-13)
    -   [elements](#elements)
        -   [Parameters](#parameters-11)
        -   [Examples](#examples-14)
    -   [properties](#properties)
        -   [Parameters](#parameters-12)
        -   [Examples](#examples-15)
    -   [path](#path)
        -   [Parameters](#parameters-13)
        -   [Examples](#examples-16)
    -   [typecast](#typecast)
        -   [Parameters](#parameters-14)
        -   [Examples](#examples-17)
    -   [validate](#validate)
        -   [Parameters](#parameters-15)
        -   [Examples](#examples-18)
-   [Schema](#schema-1)
    -   [Parameters](#parameters-16)
    -   [Examples](#examples-19)
    -   [path](#path-1)
        -   [Parameters](#parameters-17)
        -   [Examples](#examples-20)
    -   [validate](#validate-1)
        -   [Parameters](#parameters-18)
        -   [Examples](#examples-21)
    -   [assert](#assert)
        -   [Parameters](#parameters-19)
        -   [Examples](#examples-22)
    -   [message](#message-1)
        -   [Parameters](#parameters-20)
        -   [Examples](#examples-23)
    -   [validator](#validator)
        -   [Parameters](#parameters-21)
        -   [Examples](#examples-24)
    -   [typecaster](#typecaster)
        -   [Parameters](#parameters-22)
        -   [Examples](#examples-25)

### Property

Экземпляр свойства возвращается при каждом вызове `schema.path()`.
Свойства также создаются внутри, когда объект передается конструктору схемы.

#### Parameters

-   `name` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** название свойства
-   `schema` **[Schema](#schema)** вложеная схема

#### message

Регистрирует сообщения.

##### Parameters

-   `messages` **([Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String))** 

##### Examples

```javascript
prop.message('что-то не так')
prop.message({ required: 'параметр обязателен.' })
```

Returns **[Property](#property)** 

#### schema

Смонтировать заданную схему на текущем пути.

##### Parameters

-   `schema` **[Schema](#schema)** схема для монтирования

##### Examples

```javascript
const user = new Schema({ email: String })
prop.schema(user)
```

Returns **[Property](#property)** 

#### use

Validate using named functions from the given object.
Error messages can be defined by providing an object with
named error messages/generators to `schema.message()`

The message generator receives the value being validated,
the object it belongs to and any additional arguments.

##### Parameters

-   `fns` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** object with named validation functions to call

##### Examples

```javascript
const schema = new Schema()
const prop = schema.path('some.path')

schema.message({
  binary: (path, ctx) => `${path} must be binary.`,
  bits: (path, ctx, bits) => `${path} must be ${bits}-bit`
})

prop.use({
  binary: (val, ctx) => /^[01]+$/i.test(val),
  bits: [(val, ctx, bits) => val.length == bits, 32]
})
```

Returns **[Property](#property)** 

#### required

Registers a validator that checks for presence.

##### Parameters

-   `bool` **[Boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?** `true` if required, `false` otherwise (optional, default `true`)

##### Examples

```javascript
prop.required()
```

Returns **[Property](#property)** 

#### type

Registers a validator that checks if a value is of a given `type`

##### Parameters

-   `type` **([String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function))** type to check for

##### Examples

```javascript
prop.type(String)
```

```javascript
prop.type('string')
```

Returns **[Property](#property)** 

#### string

Convenience method for setting type to `String`

##### Examples

```javascript
prop.string()
```

Returns **[Property](#property)** 

#### number

Convenience method for setting type to `Number`

##### Examples

```javascript
prop.number()
```

Returns **[Property](#property)** 

#### array

Convenience method for setting type to `Array`

##### Examples

```javascript
prop.array()
```

Returns **[Property](#property)** 

#### date

Convenience method for setting type to `Date`

##### Examples

```javascript
prop.date()
```

Returns **[Property](#property)** 

#### length

Registers a validator that checks length.

##### Parameters

-   `rules` **([Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number))** object with `.min` and `.max` properties or a number
    -   `rules.min` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** minimum length
    -   `rules.max` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** maximum length

##### Examples

```javascript
prop.length({ min: 8, max: 255 })
prop.length(10)
```

Returns **[Property](#property)** 

#### size

Registers a validator that checks size.

##### Parameters

-   `rules` **([Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number))** object with `.min` and `.max` properties or a number
    -   `rules.min` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** minimum size
    -   `rules.max` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** maximum size

##### Examples

```javascript
prop.size({ min: 8, max: 255 })
prop.size(10)
```

Returns **[Property](#property)** 

#### enum

Registers a validator for enums.

##### Parameters

-   `enums`  
-   `rules` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)** allowed values

##### Examples

```javascript
prop.enum(['cat', 'dog'])
```

Returns **[Property](#property)** 

#### match

Registers a validator that checks if a value matches given `regexp`.

##### Parameters

-   `regexp` **[RegExp](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp)** regular expression to match

##### Examples

```javascript
prop.match(/some\sregular\sexpression/)
```

Returns **[Property](#property)** 

#### each

Registers a validator that checks each value in an array against given `rules`.

##### Parameters

-   `rules` **([Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) \| [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Schema](#schema) \| [Property](#property))** rules to use

##### Examples

```javascript
prop.each({ type: String })
prop.each([{ type: Number }])
prop.each({ things: [{ type: String }]})
prop.each(schema)
```

Returns **[Property](#property)** 

#### elements

Registers paths for array elements on the parent schema, with given array of rules.

##### Parameters

-   `arr` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)** array of rules to use

##### Examples

```javascript
prop.elements([{ type: String }, { type: Number }])
```

Returns **[Property](#property)** 

#### properties

Registers all properties from the given object as nested properties

##### Parameters

-   `props` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** properties with rules

##### Examples

```javascript
prop.properties({
  name: String,
  email: String
})
```

Returns **[Property](#property)** 

#### path

Proxy method for schema path. Makes chaining properties together easier.

##### Parameters

-   `args` **...any** 

##### Examples

```javascript
schema
  .path('name').type(String).required()
  .path('email').type(String).required()
```

#### typecast

Typecast given `value`

##### Parameters

-   `value` **Mixed** value to typecast

##### Examples

```javascript
prop.type(String)
prop.typecast(123) // => '123'
```

Returns **Mixed** 

#### validate

Validate given `value`

##### Parameters

-   `value` **Mixed** value to validate
-   `ctx` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** the object containing the value
-   `path` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** path of the value being validated (optional, default `this.name`)

##### Examples

```javascript
prop.type(Number)
assert(prop.validate(2) == null)
assert(prop.validate('hello world') instanceof Error)
```

Returns **ValidationError** 

### Schema

Схема определяет структуру, по которой объекты должны проверяться.

#### Parameters

-   `obj` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** определение схемы (optional, default `{}`)
-   `opts` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** опции (optional, default `{}`)
    -   `opts.typecast` **[Boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Типовые значения перед проверкой (optional, default `false`)
    -   `opts.strip` **[Boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** свойства не определены в схеме (optional, default `true`)
    -   `opts.strict` **[Boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** проверка завершается неудачно, когда объект содержит свойства, не определенные в схеме (optional, default `false`)

#### Examples

```javascript
const post = new Schema({
  title: {
    type: String,
    required: true,
    length: { min: 1, max: 255 }
  },
  content: {
    type: String,
    required: true
  },
  published: {
    type: Date,
    required: true
  },
  keywords: [{ type: String }]
})
```

```javascript
const author = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  posts: [post]
})
```

#### path

Создать или обновить `путь` с помощью заданных правил.

##### Parameters

-   `path` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** полный путь с использованием dot-notation
-   `rules` **([Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) \| [String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Schema](#schema) \| [Property](#property))?** правила для применения

##### Examples

```javascript
const schema = new Schema()
schema.path('name.first', { type: String })
schema.path('name.last').type(String).required()
```

Returns **[Property](#property)** 

#### validate

Validate given `obj`.

##### Parameters

-   `obj` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** the object to validate
-   `opts` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** options, see [Schema](#schema-1) (optional, default `{}`)

##### Examples

```javascript
const schema = new Schema({ name: { required: true }})
const errors = schema.validate({})
assert(errors.length == 1)
assert(errors[0].message == 'name is required')
assert(errors[0].path == 'name')
```

Returns **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)** 

#### assert

Assert that given `obj` is valid.

##### Parameters

-   `obj` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `opts` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** 

##### Examples

```javascript
const schema = new Schema({ name: String })
schema.assert({ name: 1 }) // Throws an error
```

#### message

Override default error messages.

##### Parameters

-   `name` **([String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object))** name of the validator or an object with name-message pairs
-   `message` **([String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function))?** the message or message generator to use

##### Examples

```javascript
const hex = (val) => /^0x[0-9a-f]+$/.test(val)
schema.path('some.path').use({ hex })
schema.message('hex', path => `${path} must be hexadecimal`)
```

```javascript
schema.message({ hex: path => `${path} must be hexadecimal` })
```

Returns **[Schema](#schema)** 

#### validator

Override default validators.

##### Parameters

-   `name` **([String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object))** name of the validator or an object with name-function pairs
-   `fn` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)?** the function to use

##### Examples

```javascript
schema.validator('required', val => val != null)
```

```javascript
schema.validator({ required: val => val != null })
```

Returns **[Schema](#schema)** 

#### typecaster

Override default typecasters.

##### Parameters

-   `name` **([String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object))** name of the validator or an object with name-function pairs
-   `fn` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)?** the function to use

##### Examples

```javascript
schema.typecaster('SomeClass', val => new SomeClass(val))
```

```javascript
schema.typecaster({ SomeClass: val => new SomeClass(val) })
```

Returns **[Schema](#schema)** 

## Licence

MIT

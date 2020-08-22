type Class = {
  new(): any
  prototype: any
}

const indexOf: ( haystack: Array< typeof needle >, needle: any ) => number = Function.call.bind( [ 0 ].indexOf ) as any
const parse = JSON.parse
const stringify = JSON.stringify

var TYPES = function ( constructr ) {

  var TYPES: {
    [ key: string ]: Function
  } = {}

  TYPES.OBJECT = TYPES.constructor
  TYPES.FUNCTION = TYPES.constructor.constructor
  TYPES.ARRAY = [].constructor
  TYPES.STRING = ''.constructor
  TYPES.NUMBER = ( 0 ).constructor
  TYPES.BOOLEAN = ( false ).constructor
  TYPES.REGEX = ( /\// ).constructor

  return new Proxy( TYPES, {
    get ( target, name: string ) {
      return target[ name.toUpperCase() ]
    }
  })
}( 'constructor' )

function getConstructor ( entry: Object ): typeof Object
function getConstructor ( entry: Array< any > ): typeof Array
function getConstructor ( entry ): Function | false {
  try {
    return entry.constructor
  }
  catch ( e ) {
    return false
  }
}

var matchTypes = function ( type: Function | Array<Function>, c: Function ) {
  try {
    return ( c === type || -1 !== indexOf( type as Array<Function>, c ) )
  }
  catch ( e ) {
    return false
  }
}

const objectValidationHelper = function ( property ) {
  let propertySchema = new Schema( property )
  return propertySchema.validate( this[ property.name ] )
}
const objectValidator = function ( entry, properties ): boolean {
  return properties.every( objectValidationHelper, entry )
}

const arrayValidationHelper = function ( member ) {
  return this.validate( member )
}
const arrayValidator = function ( entry, schema ): boolean {
  let arraySchema = new Schema( schema )
  return entry.every( arrayValidationHelper, arraySchema )
}

const objectStandardisationHelper: ( this, property: SchemaProperty ) => void = function ( property: SchemaProperty ) {
  this[ property.name ] = ( new Schema( property ) ).standardise( this[ property.name ] )
}
const objectStandardisor = function ( out, properties: Array< any > ) {
  properties.forEach( objectStandardisationHelper, out )
}

const arrayStandardisationHelper = function ( this: Schema, member ) {
  this.standardise( member )
}

const arrayStandardisor = function ( out, members ) {
  let schema = new Schema( members )
  out.forEach( arrayStandardisationHelper, schema )
}

type SchemaType = {
  type: Class | Array< Class >,
  properties?: Array< SchemaProperty >,
  members?: Class | Array< Class >,
  defacto?: any,
  allowed?: Array< any >
}

type SchemaProperty = SchemaType & { name: string }

type SchemaMainType = {
  type: Class | Array< Class >
}

type SchemaObject = {
  type: 'object',
  properties: Array< SchemaPropertyObject >
}
type SchemaPropertyObject = SchemaObject & { name: string }

type SchemaEntry = SchemaObject | SchemaPropertyObject

class Schema {

  schema: SchemaType

  constructor ( input: SchemaType ) {
    this.schema = input
  }

  validate ( entry: any ): boolean {
    let structor = getConstructor( entry )

    if ( TYPES.OBJECT === this.schema.type ) {
      if ( structor === this.schema.type ) {
        if ( TYPES.ARRAY === getConstructor( this.schema.properties ) ) {
          return objectValidator( entry, this.schema.properties )
        }
        return true
      }
      else {
        return false
      }
    }
    else if ( TYPES.ARRAY === this.schema.type ) {
      if ( structor === this.schema.type ) {
        return arrayValidator( entry, this.schema.members )
      }
      else {
        return false
      }
    }
    else {
      if ( this.schema.allowed instanceof TYPES.ARRAY ) {
        return matchTypes( this.schema.type, structor ) && -1 !== this.schema.allowed.indexOf( entry )
      }
      else {
        return matchTypes( this.schema.type, structor )
      }
    }

    return false
  }

  standardise ( entry: any ) {
    var out = entry
    var structor = getConstructor( entry )

    if ( TYPES.OBJECT === this.schema.type ) {
      if ( structor !== this.schema.type ) {
        out = {}
      }
      if ( TYPES.ARRAY === getConstructor( this.schema.properties ) ) {
        objectStandardisor( out, this.schema.properties )
      }
    }
    else if ( TYPES.ARRAY === this.schema.type ) {
      if ( structor !== this.schema.type ) {
        out = []
      }
      arrayStandardisor( out, this.schema.members )
    }
    else {
      if ( this.schema.allowed instanceof TYPES.ARRAY ) {
        if ( -1 === ( < Array< any > > this.schema.allowed ).indexOf( out ) ) {
          let val = this.schema.allowed[ 0 ]
          out = 'object' === typeof val ? parse( stringify( val ) ) : val
        }
      }
      else if ( getConstructor( this.schema.defacto ) ) {
        if ( null === out || undefined === out ) {
          let val = this.schema.defacto
          out = 'object' === typeof val ? parse( stringify( val ) ) : val
        }
      }
    }

    return out
  }

}

export default Schema

/* Using C# via Edge.js: http://tjanczuk.github.io/edge */

var edge = require('edge');

var payload = { anInteger: 1, aNumber: 3.1415, aString: 'fooaaa', aBoolean: true, aBuffer: new Buffer(10), anArray: [ 1, 'fooaaaaa' ], anObject: { a: 'foaaaao', b: 12 };

var getPerson = edge.func(function () {/*
    using System.Threading.Tasks;

    public class Person
    {
        public int anInteger = 1;
        public double aNumber = 3.1415;
        public string aString = "foo";
        public bool aBoolean = true;
        public byte[] aBuffer = new byte[10];
        public object[] anArray = new object[] { 1, "foo" };
        public object anObject = new { a = "foo", b = 12 };
    }

    public class Startup
    {
        public async Task<object> Invoke(dynamic input)
        {
            Person person = new Person()
            {
              anInteger = (int)input.anInteger,
              aNumber = (double)input.aNumber,
              aString = (string)input.aString,
              aBoolean = (bool)input.aBoolean,
              aBuffer = (byte[])input.aBuffer,
              anArray = (object[])input.anArray,
              anObject = (dynamic)input.anObject,
            };
            return person;
        }
    }
*/});

module.exports = function (context, cb) {
    // getPerson(payload, cb);
    getPerson(context.data, cb);
}
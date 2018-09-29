const graphql = require('graphql');
const axios = require ('axios');

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull
} = graphql;


//Name and Fields are always required!
const CompanyType = new GraphQLObjectType({
    name: "Company",
    //wrap in arrow function because this will be defined but not run until until file has been executed
    fields: () => ({
        id: {type: GraphQLString},
        name: {type: GraphQLString},
        description: {type: GraphQLString},
        users: {
            type: new GraphQLList (UserType), //use GraphQLList because we have multiple users associated with one company
            resolve(parentValue, args){
                return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`)
                .then(response => response.data)
            }
        }
    })
});


const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: {type: GraphQLString } ,
        firstName: {type: GraphQLString },
        age: {type: GraphQLInt },
        company: {
            type: CompanyType,
            //we need a resolve function because company does not match the database
            resolve (parentValue, args){
                //parentValue is the user response
               return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
               .then (res => res.data)
            }
        }
    })
})


//The RootQuery is how we enter the graph
//This points us to our User Types, then a company type
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields:{
        user:{
            type: UserType,
            args: {id: {type: GraphQLString}},

            //This takes us from what part on the graph to another. Takes us to the user type
            resolve(parentValue, args){
              return axios.get(`http://localhost:3000/users/${args.id}`)
              // Make the request, and before anythise else happens in promise, return only response.data
              .then(response => response.data) 
            }
        },
        company: {
            type: CompanyType,
            args: {id: {type: GraphQLString}},
            resolve(parentValue, args){
                return axios.get(`http://localhost:3000/companies/${args.id}`)
                .then(response => response.data)
            }

        }
    }
});

const mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addUser: {
            type: UserType, //this refers to the type of data returned from the mutation
            args: {
                firstName: { type: new GraphQLNonNull(GraphQLString)}, //Graphnonnull means its required
                age: {type: new GraphQLNonNull (GraphQLInt)},
                companyId: { type: GraphQLString}
            },
            resolve(parentValue, {firstName, age}){
                return axios.post('http://localhost:3000/users', {firstName, age})
                .then(response => response.data);
            }
        },
        deleteUser: {
            type: UserType,
            args: {
                id: {type: new GraphQLNonNull(GraphQLString)}
            },
            resolve(parentValue, {id}){
                return axios.delete(`http://localhost:3000/users/${id}`)
                .then (response => response.data)
            }
        },
        editUser: {
            type: UserType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString)},
                firstName: {type: GraphQLString},
                age: {type: GraphQLInt},
                companyId: {type: GraphQLString},
            },
            resolve(parentValue, args){
                return axios.patch(`http://localhost:3000/users/${args.id}`, args)
                .then(response => response.data)
            }  
        }
    }
})

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation
})
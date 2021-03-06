
# Redone
We have many [#Tasks](#) and [#ToDo](#) that needs to be done. Some of them need our [#Immediate](#) attention and some others are just [#CoolToDo](#). We all have lists of [#BooksToRead](#), [#PlacesToVisit](#), [#Groceries](#) to buy and [#BillsToPay](#).

## But how to organize and memorize these?
Using many of the task management and productivity apps could be completed and time consuming and to personalize them to our advantage is another [#task](#) added to our list.

We create [#Redone](#) to save more time to spend with our [@friends](#) and [@family](#).

## [#Redone](#), is as simple as writing a tweet:
Just write your [#job](#) and mention your [@family](#) and [@friends](#) if you like to contribute to that task with you.

- [Concepts](https://redone.herokuapp.com/concepts.html)
- [Use Cases](https://redone.herokuapp.com/use-cases.html)
- [Updates](https://redone.herokuapp.com/updates.html)

## Documentations
- [Strapi Framework](https://strapi.io/)
- [API Endpoints](https://strapi.io/documentation/3.0.0-beta.x/content-api/api-endpoints.html)
- [Upload Project on Heroku](https://strapi.io/documentation/3.0.0-beta.x/deployment/heroku.html)


## Run Redone on local

1. Install [Yarn](https://yarnpkg.com/) on your system:
``npm install -g yarn``

2. Clone this project:
``$ git clone https://github.com/RedoneApp/Redone.git``

3. Open project folder
`` cd Redone``

4. Install Yarn Packages
`` yarn install``

5. Run strapi
``yarn strapi dev``

6. Now create admin account in [admin panel](http://localhost:1337/admin)
7. Then [create a user](http://localhost:1337/admin/plugins/content-manager/collectionType/plugins::users-permissions.user) to using Redone App (this user is different from admin user)
8. Now everything is ready to use, just open [http://localhost:1337/](http://localhost:1337/) and Signin with your user name and password

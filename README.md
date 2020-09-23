# Piggy-Project

## Intro
a Basic web-app with user registration and database management uses JS' async requests to get data from server.

- **Goals:**
  - Learning Javascript.
  - Getting to know Python's web-app-backend, and Flask framework in particular.
  - Dusting off Web Development skills.
  - Another Corona Project.
  
## Demo:
#### Images:
<img src="---">

#### Demo Users:
a registered user for test purposes: `username:demo_user | password:123456`

## Files
 - **/piggy:** a dir and a python package.
    - **__ init __.py:** Configures the `app` instances and control the imports order (prevent circular imports).
    - **routes.py:** Deals with requests and responses, in particular defines the app routes.
    - **models.py:** Defines the DB tables with SQLAlchemy's models as classes.
    - **forms.py:** Defines the main forms of the app and partly their UI.
 - **/piggy/templates:** all the HTML files
 - **/piggy/static/js:** all the JS code, arranged and written using MVC.
 - **/piggy/styles:** all the CSS files
 - **Procfile, requirements.txt, runtime.txt:** Files for production.
 - **run.py:** Contains the initiated `app`, and runs the web-app when called as a script. 
 - **dev_scripts.py:** scripts for developer use.

## Modules:
#### CSS:
 - Bootstrap 4.5.2
#### Javascript:
 - Mark.js 8.11.1
 - Chart.js 2.8.0
#### Python:
  - Flask
  - Flask Forms (Flask_WTF), Flask Login (Flask_Login)
  - SQLAlchemy

## Usage
#### Run app directly:
   Via the [production server](https://mypiggy.herokuapp.com).
#### Clone/Modify app: 
  - **Database:** Set Postgres' sql database with the following settings `postgresql://postgres:123456@localhost:5000/piggy `, 
  alternatively change the following line in `piggy/__init__.py`: 
    ``` 
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:123456@localhost:5000/piggy'
    ```
  - Then, in order to create the needed sql tables, run the following command from the project's dir: `$ python dev_scripts.py create_tables `
  - **Run:** `$ python run.py`
  
## Features to add:
 - **Table Page:**
   - Scroll Spy for the Months (a MUST for long table management)
   - Separate HTML elements that TABLE and ANALYSIS share - for DRY html code.

 - **Analysis Page:** 
   - Scroll spy for the charts
   - add 'facts' row:
      - average monthly net income
      - most weighted category (income, expanses separately)
     
 - **Home Page:**
   - Dynamic Cards: user can add more cards to his home page, these will contain : annlyzed data (biggest expanse, most recent big income ),user notes, and more...

 - **Account:**
   - User can define different month start and end.
   - User can define: constant expanses (that happens monthly, for example - rent), monthly goals (for month net-income)
   - change password, change email

 - **pages to add:**
   - API Documentation with User-Authetication
  



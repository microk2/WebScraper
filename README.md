# WebScraper
A JS project made by a lazy pleb to get info from websites.\
Maybe it works better in other programming languages, who knows /shrug
## Requirements
1. Node.js - [Download](https://nodejs.org/en/download/)
2. MySQL
3. A CLI (Git Bash, Cmd etc)

## How to use it
First of all you have to open the project folder with a CLI and write:
```npm install``` to download all dependencies

* Get quest starter/ender for WoW quests:\
With any CLI go to the project folder and write:
```
node queststarter questId1 questId2 etc... OR node queststarter questId1, questId2 etc...
```
You can also provide quest line id using "-ql" option and the script will get the quest ids from your database (require MySQL). You should have a db2 database. In settings.json you need to change database name with yours.
```
node queststarter -ql 1, 18, 19 (with or without the comma)
```
This will create a .sql file with the SQL queries for creature/gameobject queststarter/ender for your quests.\
Note: all the info is taken from WoWHead

* Some other functionality #2?
* Some other functionality #3?
* Some other functionality #4?
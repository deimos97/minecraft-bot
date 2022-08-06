# Minecraft autonomous bot

## TODO
 - Requirements on tasks (or should they be on Goals as well?). It may be a good idia for requirements to be on all of the classes (to reduce the chance of the bot getting stuck).
 - Take current behaviour of chopping tree and collecting it's items and turn it into a goal.
 - Make a comprehensive set up process and explaint it here

## Set up process

TODO


# Brief code explanation

I've divided the differnt bot actions on *Goals*, *Routines* and *Tasks*. These actions combine to form all the bots behaviours. 


## Goal

A goal is made up of different routines that help the bot achieve a Goal. A goal such as "Collect Diamonds" could be made up of different routines:
 - Check for required items
 - Scan for nearby diamonds
 - Go to the nearby diaminds
 - Mine them
 - Collect them
 - Take them to an storage
 - Store them

## Routine

The routine is a reusable set of task that will perform a repeatable action. For example the routine:
 - Check for required items

Could be made up of the following task
  - Scan for items
  - If found return the positions
  - If not found trigger the routine "radial search" (let's say this one moves you to a spot where the bot can stop diamons)
  - Run routine again (to scan again)

## Tasks

A task is an specific action to be performed by the bot. Here we will call the "low level" functions of the bot API. For example the task:
   - Scan for items

Will call the API function `blocksByName` to return the position of blocks by a name and then process the entity positions to return what you may need.
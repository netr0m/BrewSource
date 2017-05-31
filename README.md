[![forthebadge](http://forthebadge.com/images/badges/made-with-python.svg)](http://forthebadge.com) [![forthebadge](http://forthebadge.com/images/badges/gluten-free.svg)](http://forthebadge.com)
# [BrewSource](http://brewsource.no) - :sailboat:Sails.js for frontend, :snake:Python for backend

BrewSource is an open source, Raspberry Pi-powered monitor for your beer fermentation :beers:. Written in :snake:Python and :sailboat:Sails.js. We'd love help of any kind, whether you'd like to contribute by submitting a bug, or have a request for a feature. You can also contribute with development, but please read the guidelines on [Contribution](#contribution) before you begin.

## Table of contents
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Features](#features)
- [Bugs and feature requests](#bugs-and-feature-requests)
- [Contribution](#contribution)
- [License](#license)
- [Contributors](#contributors)

## Getting Started
- You will need [NodeJS](https://nodejs.org/en/) and [SailsJS](http://sailsjs.com/get-started) in order to run the Sails-driven part of the application on your machine.
- You will also need [Python 3.x.x](https://www.python.org/downloads/) for the Raspberry Pi in order to get the temperature-monitoring going. You can see more about that over at the [python branch](https://github.com/mortea15/BrewSource/tree/python)
- After you've cloned the repository, checkout to the sails branch by typing
``
git checkout sails
``
- Now, while in the terminal, navigate to your local clone (folder) and type
``
npm install
``
- **Finally, run sails lift in the command line**

## Documentation
https://github.com/mortea15/BrewSource/wiki

## Features 
Coming soon

## Contribution
We would love your help in the development of BrewSource. Please follow our guidelines on [Contribution](#contribution) on how to report bugs and request features you'd like to see, in addition to how you can contribute with development.
By following these guidelines, we make sure that communication is efficient and understandable, which hopefully will help us improve the project.

## Bugs and feature requests
If you want to submit a feature request or bug, please keep this in mind:
- Stay on topic, both regarding the request/bug itself and any discussion around it.
- Please avoid opening issues if it involves lines of code you do not understand.

### Bug reports
Definition of a bug:
A bug is an error, fault or failure in the application which is caused by the sourcecode found in this repository, which results in an incorrect or unexpected result.

We appreciate feedback of any sort, and it helps us in developing a great service. Thank you!
- Please browse the [issue tracker](https://github.com/mortea15/BrewSource/issues) before you submit a bug or feature, to avoid duplicate entries.
- Before submitting, make sure to pull the latest version to check if the bug is fixed, or feature is implemented.
- Stick to ONE bug per issue.
* Please use the following format when submitting:

**Short description of what happened**

*Description*

**Expected behaviour**

*Description*

**Actual Behaviour**

*Description*

**Steps to reproduce**

*Description*

**Your enviroment**

*Operative System, NodeJS Version, SailsJS Version, and any other information of relevance (for the Sails-branch)*

*Operative System, Python Version, and any other information of relevance (for the Python-branch)*

### Feature requests
We're open for adding new features, please keep in mind that it should be of relevance to this project.
- Including details when submitting feature requests is essential. It makes it easier for the developers to understand the request.

### Pull requests 
- Please include documentation on all code submitted
- If a new feature is implemented, it should be explained with detail in the [Wiki](https://github.com/mortea15/BrewSource/wiki)

## License
[GPL3.0](https://github.com/mortea15/BrewSource/blob/master/LICENSE)

## Contributors
**Developed by:**
- [Morten Amundsen.py](https://github.com/mortea15/)
- [Svenn-Roger Sørensen.js](https://github.com/tjodalv2k)
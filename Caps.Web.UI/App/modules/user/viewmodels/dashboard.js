define(['infrastructure/utils', 'durandal/app', 'durandal/system', 'plugins/dialog', 'knockout', 'moment', 'authentication', '../datacontext', '../module', '../commands/deleteUser'],
function (utils, app, system, dialog, ko, moment, authentication, datacontext, module, deleteUserCommand) {

    var users = ko.observableArray(),
        initialized = false,
        isLoading = ko.observable(false);

    app.on('caps:user:created', function (data) {
        refreshUsers();
    });

    app.on('caps:user:deleted', function (data) {
        if (data && data.userName) {
            var cachedUser = findCachedUserByUserName(data.userName());
            users.remove(cachedUser);
        }
    });

    app.on('caps:user:updated', function (data) {
        var cachedUser = findCachedUserByUserName(data.UserName);
        if (cachedUser) cachedUser.refresh(data);
    });
    
    app.on('caps:authentication:loggedOff', function () {
        users.removeAll();
        initialized = false;
    });

    function refreshUsers() {
        isLoading(true);

        datacontext.getAllUsers()
        .then(function (data) {
            users.removeAll();
            ko.utils.arrayForEach(data, function (item) {
                users.push(item);
            });
        })
        .fail(function (err) {
            system.log('Error loading Users: ' + err.message);
            dialog.showMessage('Die Benutzer-Daten konnten nicht geladen werden.');
        })
        .done(function () {
            isLoading(false);
        });
    }

    function addUser() {
        module.router.navigate('#/users/add', true);
    }

    function findCachedUserByUserName(userName) {
        return ko.utils.arrayFirst(users(), function (item) {
            return item.userName() === userName;
        });
    }

    return {
        users: users,
        moment: moment,

        addUser: addUser,
        deleteUser: deleteUserCommand.execute,
        refresh: refreshUsers,

        isLoading: isLoading,

        activate: function () {
            if (!initialized) {
                initialized = true;
                refreshUsers();
            }
        },

        shouldActivate: function (router, currentActivationData, newActivationData) {
            return initialized ? utils.compareArrays(currentActivationData, newActivationData) : true;
        }
    };

});
define(['modules/user/module', '../entities', '../datacontext', 'knockout', 'Q'], function (module, model, datacontext, ko, Q) {
    
    var app = require('durandal/app'),
        system = require('durandal/system'),
        authentication = require('authentication');

    var allRoles = ko.observableArray([]),
        userRoles = ko.observableArray([]);

    var vm = {
        user: ko.observable().extend({ trackDirtyWithInitialStateOf: false }),
        isNewUser: ko.observable(true),
        roles: userRoles,

        activate: function (userName) {
            reset();
            if (userName) {
                this.isNewUser(false);
                return getUser(userName);
            }
            else {
                this.isNewUser(true);
                var user = new model.User();
                user.password.extend({ required: true });
                user.userName.extend({ isUserNameUnique: { message: 'Dieser Benutzername ist bereits vergeben. Bitte wähle einen anderen.' } });
                return setCurrentUser(user);
            }
        },

        canDeactivate: function () {
            system.log('canDeactivate editor');

            if (!vm.user.isDirty())
                return true;

            return app.showMessage('Sollen die Änderungen gespeichert werden', 'Änderungen speichern?', ['Speichern', 'Verwerfen', 'Abbrechen'])
                .then(function (result) {
                    if (result === 'Speichern') {
                        return saveChanges()
                            .then(function () { return true; })
                            .fail(function () { return false; });
                    }
                    else if (result === 'Abbrechen') {
                        return false;
                    }
                    else
                        return true;
                });
        },

        deactivate: function () {
            system.log('deactivate editor');
            vm.user.markClean();
        },

        save: function () {
            saveChanges().then(function () {
                navigateBack();
            });
        },

        cancel: function () {
            navigateBack();
        }
    };

    vm.user.isDirty.subscribe(function (newValue) {
        module.routeConfig.hasUnsavedChanges(newValue);
    });

    function getUser(userName) {
        return datacontext.getUser(userName)
            .then(setCurrentUser)
            .fail(handleAjaxError);
    }

    function setCurrentUser(user) {
        return refreshRoles()
            .then(function () {
                buildUserRoles(allRoles(), user);
                vm.user(user);
                vm.user.markClean();
            });
    }

    function saveChanges() {
        var deferred = Q.defer();

        if (vm.user().errors().length > 0) {
            return app.showMessage('Die Änderungen können noch nicht gespeichert werden. Kontrolliere die markierten Eingabefelder.', 'Eingaben unvollständig')
                .then(function () {
                    deferred.reject();
                    return deferred.promise;
                });
        }

        var func = vm.isNewUser() ? createUser : updateUser;
        func.call(vm).then(function () {
            vm.user.markClean();
            deferred.resolve();
        })
        .fail(function (err) {
            deferred.reject(err);
        })
        .done();

        return deferred.promise;
    }

    function createUser() {
        return datacontext.createUser(this.user())
            .then(function (data) { 
                app.trigger('caps:user:created', data);
            })
            .fail(handleAjaxError);
    }

    function updateUser() {
        return datacontext.updateUser(this.user())
            .then(function (data) {
                app.trigger('caps:user:updated', data);
            })
            .fail(handleAjaxError);
    }

    function reset() {
        vm.roles.removeAll();
        vm.user(new model.User());
        vm.user.markClean();
    }

    function refreshRoles() {
        return datacontext.getAllRoles().then(function (data) {
            allRoles(data);
        });
    }

    function buildUserRoles(roles, user) {
        var models = ko.utils.arrayMap(roles, function (item) {
            return new UserRoleItem(item, user);
        });

        // User can not change his own Admin-Role.
        if (user.userName() == authentication.user().userName()) 
            disableRoleItem(models, 'Administrator');        
        
        userRoles(models);
    }

    function disableRoleItem(items, roleName) {
        var item = ko.utils.arrayFirst(items, function (item) {
            return item.role() == roleName;
        });
        if (item) {
            item.isEnabled(false);
        }
    }

    function handleAjaxError(err) {
        app.showMessage('Bei der Ausführung der Aktion ist ein Fehler aufgetreten.', 'Fehler aufgetreten');
        throw new Error(err);
    }

    function navigateBack() {
        module.router.navigateBack();
    }

    var UserRoleItem = function (role, user) {
        var self = this;
        self.role = ko.observable(role);
        self.user = user;
        self.isChecked = ko.observable(user && user.isInRole ? user.isInRole(role) : false);
        self.isEnabled = ko.observable(true);

        this.isChecked.subscribe(function (newValue) {
            var user = self.user;
            var role = self.role();
            var handler = newValue ? user.addToRole : user.removeFromRole;
            handler.call(user, role);
        });
    };

    return vm;

});
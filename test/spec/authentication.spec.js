define(['infrastructure/authentication', 'plugins/router', 'moment'], function (authentication, router, moment) {

    describe('Authentication', function () {

        var logonModuleId = 'viewmodels/login';
        var logonRoute = 'login';

        it('defines a logon-Function on the router', function () {
            expect(router.logon).toBeDefined();
        });

        it('defines a redirectFromLogonView-Function on the router', function () {
            expect(router.redirectFromLogonView).toBeDefined();
        });

        describe('router.logon', function () {
            it('saves the given routeInfo in the router.logonSuccessRoute-Property', function () {
                var routeInfo = { config: { moduleId: '' } };
                router.logon(routeInfo);
                expect(router.logonSuccessRoute).toBe(routeInfo);
            });

            it('returns the logon-route', function () {
                var routeInfo = { config: { moduleId: '' } };
                var result = router.logon(routeInfo);
                expect(result).toEqual(logonRoute);
            });

            it('throws an error when called with the logon-route', function () {
                var routeInfo = { config: { moduleId: logonModuleId } };
                expect(function () {
                    router.logon(routeInfo);
                })
                .toThrow(new Error('The logon-Function may not be called with the logon-route.'));
            });
        });

        describe('router.redirectFromLogonView', function () {
            it('calls router.navigate', function () {
                spyOn(router, 'navigate');
                router.redirectFromLogonView();
                expect(router.navigate).toHaveBeenCalled();
            });

            it('navigates to the default return url when there is no logonSuccessRoute available', function () {
                spyOn(router, 'navigate');
                delete router.logonSuccessRoute;
                router.redirectFromLogonView();
                expect(router.navigate).toHaveBeenCalledWith('', { trigger: true, replace: true });
            });

            it('navigates to the logonSuccessRoute when one is available', function () {
                spyOn(router, 'navigate');
                router.logonSuccessRoute = { config: { hash: '#some-hash' } };
                router.redirectFromLogonView();
                expect(router.navigate).toHaveBeenCalledWith('#some-hash', { trigger: true, replace: true });
            });

            it('deletes the logonSuccessRoute after navigating to it', function () {
                router.logonSuccessRoute = { config: { hash: '#some-hash' } };
                router.redirectFromLogonView();
                expect(router.logonSuccessRoute).not.toBeDefined();
            });
        });

        describe('router.guardRoute', function () {
            it('calls logon with the given routeInfo when the user is not authenticated', function () {
                authentication.user(new authentication.UserModel());
                var routeInfo = { config: { hash: '#some-hash' } };
                spyOn(router, 'logon');
                var flag = false;

                runs(function() {
                    router.guardRoute(null, routeInfo).then(function() { flag = true; });
                });

                waitsFor(function () {
                    return flag;
                }, 'guardRoute to resolve', 500);

                runs(function () {
                    expect(router.logon).toHaveBeenCalledWith(routeInfo);
                });
            });

            it('does not call logon if the user is authenticated', function () {
                authentication.user(new authentication.UserModel(true, 'John Dow', ['Administrator']));
                var routeInfo = { config: { hash: '#some-hash' } },
                    flag = false;
                spyOn(router, 'logon');

                runs(function () {
                    router.guardRoute(null, routeInfo).then(function() { flag = true; });
                });
                waitsFor(function () {
                    return flag;
                }, 'guardRoute to complete', 500);
                runs(function () {
                    expect(router.logon).not.toHaveBeenCalled();
                });
            });

            it('returns the forbidden-route when the user is not in any of the roles listed in the routeInfo.roles-array', function () {
                authentication.user(new authentication.UserModel(true, 'John Dow', []));
                var routeInfo = { config: { hash: '#some-hash', roles: ['Administrator'] } };
                var flag = false,
                    result;

                runs(function () {
                    router.guardRoute(null, routeInfo).then(function (r) {
                        result = r;
                        flag = true;
                    });
                });

                waitsFor(function () {
                    return flag;
                }, 'guardRoute to complete', 500);

                runs(function () {
                    expect(result).toEqual('forbidden');
                });
            });

            it('returns true for the logon-route when the user is not authenticated', function () {
                authentication.user(new authentication.UserModel());
                var routeInfo = { config: { moduleId: logonModuleId } },
                    flag = false,
                    result;

                runs(function () {
                    router.guardRoute(null, routeInfo).then(function (r) {
                        result = r;
                        flag = true;
                    });
                });

                waitsFor(function () {
                    return flag;
                }, 'guardRoute to complete', 500);

                runs(function () {
                    expect(result).toBe(true);
                });
            });

            it('does not call logon for the logon-route', function () {
                authentication.user(new authentication.UserModel());
                var routeInfo = { config: { moduleId: logonModuleId } },
                    flag = false;
                spyOn(router, 'logon');

                runs(function () {
                    router.guardRoute(null, routeInfo).then(function() { flag = true; });
                });

                waitsFor(function () {
                    return flag;
                }, 'guardRoute to complete', 500);

                runs(function () {
                    expect(router.logon).not.toHaveBeenCalled();
                });
            });
        });

        describe('UserModel', function () {

            it('does not expire by default', function () {
                var user = new authentication.UserModel(true, 'John Doe', ['Administrator']);
                expect(user.isExpired()).toBe(false);
                user.created = moment().subtract('minutes', 60);
                expect(user.isExpired()).toBe(false);
                expect(user.expirationTicket.expiration).toBe(false);
            });

            it('does expire when a positive amount of seconds is provided', function () {
                var user = new authentication.UserModel(true, 'John Doe', ['Administrator'], {}, 60);
                expect(user.isExpired()).toBe(false);
                user.expirationTicket.created = moment().subtract('seconds', 59);
                expect(user.isExpired()).toBe(false);
                user.expirationTicket.created = moment().subtract('seconds', 61);
                expect(user.isExpired()).toBe(true);
            });

            describe('UserModel.isInRole', function () {
                it('returns true if the user is in the given role', function () {
                    var user = new authentication.UserModel(true, 'John Doe', ['Administrator']);
                    var result = user.isInRole('Administrator');
                    expect(result).toBe(true);
                });

                it('returns false if the user is not in the given role', function () {
                    var user = new authentication.UserModel(true, 'John Doe', []);
                    var result = user.isInRole('Administrator');
                    expect(result).toBe(false);
                });
            });

            describe('UserModel.isInAnyRole', function () {
                it('returns true if the user is in any of the given roles', function () {
                    var user = new authentication.UserModel(true, 'John Doe', ['Administrator']);
                    var result = user.isInAnyRole(['Honk', 'Administrator']);
                    expect(result).toBe(true);
                });
                it('returns false if the user is not in any of the given roles', function () {
                    var user = new authentication.UserModel(true, 'John Doe', ['RoleA', 'RoleB']);
                    var result = user.isInAnyRole(['Honk', 'Administrator']);
                    expect(result).toBe(false);
                });
                it('returns true if an empty array is provided', function () {
                    var user = new authentication.UserModel(true, 'John Doe', ['RoleA', 'RoleB']);
                    var result = user.isInAnyRole([]);
                    expect(result).toBe(true);
                });
            });

        });
    });

});
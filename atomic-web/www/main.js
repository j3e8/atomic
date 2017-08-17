var appConfig = {
  defaultComponentEndpoint: 'http://localhost:3010/components',
  components: {}
};

window.addEventListener("load", function() {
  $atomic.app(appConfig);
});

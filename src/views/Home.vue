<template>
  <div class="home">
    <h1>{{$t('title')}} {{version}}</h1>
    <h2>Welcome!</h2>
  </div>
</template>

<script>
// @ is an alias to /src
import { mapState } from 'vuex'

export default {
  name: 'home',
  components: {
  },
  computed: {
    ...mapState({
      version: 'version'
    })
  }
}
</script>

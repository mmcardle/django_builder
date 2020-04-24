<template>
  <v-container fluid class="text-center">
    <v-row  align="center" justify="center" fill-height >
      <v-col cols="12" >
        <div class="display-4 hidden-sm-and-down" ><django-builder-title /></div>
        <div class="display-2 hidden-md-and-up" ><django-builder-title /></div>
        <p style="color: gray">building things....</p>
        <div class="ma-3">
          <span class="label label-success">Django 2.1.X <i class="fa fa-check"></i></span>
        </div>
        <div class="body-2">
            <div class="ma-2">
              <v-icon class="red--text text-darken-3" >mdi-github-circle</v-icon>
              <a href="https://github.com/mmcardle/django_builder" target="_blank">
                Django Builder on Github
              </a>
            </div>

            <div class="ma-2">
              <v-icon class="red--text text-darken-3" >mdi-github-circle</v-icon>
              <a href="https://github.com/mmcardle/" target="_blank">
                mmcardle
              </a>
            </div>

            <div class="ma-2">
              <v-icon class="red--text text-darken-3" >mdi-twitter</v-icon>
              <a href="https://twitter.com/mmc4rdle" target="_blank">
                @mmc4rdle
              </a>
            </div>

            <div class="ma-2">
              <p class="ma-0">Django builder is free to use, and a personal project worked on in my spare time.</p>
              <p class="ma-0">Any donations are very much appreciated.</p>
              <p class="ma-0">If you want to, feel free to donate using the BitCoin address or PayPal link below.</p>
            </div>

            <div class="pt-1">
              <div class="pa-1">
                Bitcoin Address:
                <span class="red--text">
                  1J7JaUA5YhowVNtWCEoSh2tUD7pVJQfwcx
                </span>
              </div>
              <v-img src="bitcoin_add.png" height="150" width="150" class="ma-auto"></v-img>
            </div>

            <div class="pt-3">Paypal:</div>

            <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" class="mt-1">
              <input type="hidden" name="cmd" value="_s-xclick">
              <input type="hidden" name="hosted_button_id" value="L59T3C67CNC8G">
              <input type="image" src="https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif" border="0"
                     name="submit" alt="PayPal – The safer, easier way to pay online!">
              <img alt="" border="0" src="https://www.paypalobjects.com/en_GB/i/scr/pixel.gif" width="1" height="1">
            </form>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

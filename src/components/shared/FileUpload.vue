<template>
  <!-- There is no native file upload component for vuetify yet. 
This is a temporary workaround suggested by @Dohomi on this vuetify issue:
https://github.com/vuetifyjs/vuetify/issues/238 or more specifically this gist:
https://gist.github.com/dohomi/2bba9e2905d00cd1cec9c09cfd87bd10
I've modified it to accept additional props relevant for Caffeine.
-->
  <div>
    <v-text-field
      prepend-icon="attach_file"
      v-model="filename"
      :label="label"
      :required="required"
      :rules="rules"
      @click.native="onFocus"
      :disabled="disabled"
      :error-messages="errorMessages"
      ref="fileTextField"
    ></v-text-field>
    <input
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      ref="fileInput"
      @change="onFileChange"
    />
  </div>
</template>

<script>
import Vue from "vue";

export default Vue.extend({
  name: "FileUpload",
  props: {
    value: {
      type: [Array, String]
    },
    accept: {
      type: String,
      default: "*"
    },
    label: {
      type: String,
      default: "choose_file"
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: false
    },
    rules: {
      type: Array
    },
    errorMessages: {
      type: [Array, String]
    }
  },
  data() {
    return {
      filename: ""
    };
  },
  watch: {
    value(v) {
      this.filename = v;
    }
  },
  mounted() {
    this.filename = this.value;
  },
  methods: {
    getFormData(files) {
      const forms = [];
      for (const file of files) {
        const form = new FormData();
        form.append("data", file, file.name);
        forms.push(form);
      }
      return forms;
    },
    onFocus() {
      if (!this.disabled) {
        this.$refs.fileInput.click();
      }
    },
    onFileChange($event) {
      const files = $event.target.files || $event.dataTransfer.files;
      const forms = this.getFormData(files);
      if (files) {
        if (files.length > 0) {
          this.filename = [...files].map(file => file.name).join(", ");
        } else {
          this.filename = null;
        }
      } else {
        this.filename = $event.target.value.split("\\").pop();
      }
      this.$emit("input", this.filename);
      this.$emit("formData", forms);
    }
  }
});
</script>

<style scoped>
input[type="file"] {
  position: absolute;
  display: none;
}
</style>

<template>
  <!-- There is no native file upload component for vuetify yet. 
This is a temporary workaround suggested by @Dohomi on this vuetify issue:
https://github.com/vuetifyjs/vuetify/issues/238 or more specifically this gist:
https://gist.github.com/dohomi/2bba9e2905d00cd1cec9c09cfd87bd10-->
  <div>
    <v-text-field
      prepend-icon="attach_file"
      single-line
      v-model="filename"
      :label="$t(label).toUpperCase()"
      :required="required"
      @click.native="onFocus"
      :disabled="disabled"
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
  name: "NewMap",
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
      const form = this.getFormData(files);
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
      this.$emit("formData", form);
    }
  }
});
</script>

<style scoped>
input[type="file"] {
  position: absolute;
  left: -99999px;
}
</style>

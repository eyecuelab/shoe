export class JSONAPIUtil {
  static included(data, type) {
    if (!data || !data.included) {
      return [];
    }
    return data.included.filter((i) => i.type === type && i.attributes);
  }

  static actions(data) {
    if (!data || !data.meta || !data.meta.actions) {
      return [];
    }
    return data.meta.actions;
  }

  static action(data, name) {
    return this.actions(data).find((a) => a.name === name);
  }

  static attr(data, attrName) {
    if (!data || !data.data || !data.data.attributes) {
      return undefined;
    }
    return data.data.attributes[attrName];
  }

  static link(data, name) {
    if (!data || !data.links) {
      return undefined;
    }
    return data.links[name];
  }
}

export default JSONAPIUtil;

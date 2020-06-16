import { Bookshelf as JsonAPIMapper } from '../utils/jsonapi';
import Config from '../../../config/config';

const API_URL = Config.get('apiURL');

export class BaseSerializer {
  static get apiURL() {
    return API_URL;
  }

  static jsonAPI(data, req) {
    let mapper = {};
    if (data.attributes) {
      mapper = this.itemMapper(req);
    } else {
      mapper = this.listMapper(req, { pagination: data.pagination });
    }

    const resourceType = data.resourceType || this.resourceType;

    return new JsonAPIMapper(this.apiURL, mapper)
      .map(data, resourceType, { relations: true });
  }

  static url(path) {
    return `${API_URL}${path}`;
  }

  static action(method, name, path, fields = []) {
    const data = {
      name, method, url: path.startsWith('http') ? path : this.url(path),
    };
    if (fields.length > 0) {
      data.fields = [];
      fields.forEach((f) => data.fields.push(this.field(f)));
    }

    return data;
  }

  static field(data) {
    const [name, type, value, opts] = data;
    const fd = {
      name,
      type,
      ...(opts || {}),
    };
    if (value !== undefined) {
      fd.value = value;
    }

    return fd;
  }

  static options(optionsObj) {
    return Object.entries(optionsObj).map(([value, label]) => ({ value, label }));
  }

  static mapOptions(resourceArray = [], keys = ['id']) {
    const valueKey = keys.shift();
    const labelKey = keys.shift();
    return resourceArray.map((res) => {
      if (labelKey) {
        const data = {
          value: res[valueKey],
          label: res.attributes ? res.attributes[labelKey] : res[labelKey],
        };
        keys.forEach((k) => {
          data[k] = res.attributes ? res.attributes[k] : res[k];
        });
        return data;
      }
      return res[valueKey];
    });
  }
}

export default BaseSerializer;

const fs = require("fs");
const path = require("path");

// 将文件转化成模块对象
const fileToModule = function (path) {
  const fileContent = fs.readFileSync(path).toString();

  let result = {
    id: path,
    dependencies: getDependencies(fileContent),
    // code: function (require, exports) {
    //    eval(fileContent.toString());
    // }
    code: `function (require, exports) {
       ${fileContent.toString()}
    }`
  }
    return result;
};

// 获取模块的所有依赖
function getDependencies(fileContent) {
  let reg = /require\(["'](.+?)["']\)/g;
  let result = null;
  let dependencies = [];
  while ((result = reg.exec(fileContent))) {
    dependencies.push(result[1]);
  }
  return dependencies;
}

// 将所有模块以及他们的依赖转化成模块对象
function createGraph(filename) {
  let module = fileToModule(filename);
  let queue = [module];

  for (let module of queue) {
    const dirname = path.dirname(module.id);
    module.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);
      const child = fileToModule(absolutePath);
      queue.push(child);
    });
  }
  let modules = {};
  queue.forEach((item) => {
    modules[item.id] = item.code;
  });
  return modules;
}

// 执行模块函数
const exec = function (moduleId) {
  const fn = modules[moduleId];
  let exports = {};
  const require = function (filename) {
    const dirname = path.dirname(module.id);
    const absolutePath = path.join(dirname, filename);
    return exec(absolutePath);
  };
  // 如果要执行这行代码，放开 11 行代码的注释
  // fn(require, exports);
  return exports;
};

// 生成打包的文件
function createBundle(modules){
  let __modules = "";
  for (let attr in modules) {
    __modules += `"${attr}":${modules[attr]},`;
  }
  const result = `(function(){
    const modules = {${__modules}};
    const exec = function (moduleId) {
      const fn = modules[moduleId];
      let exports = {};
      const require = function (filename) {
        const dirname = path.dirname(module.id);
        const absolutePath = path.join(dirname, filename);
        return exec(absolutePath);
      };
      fn(require, exports);
      return exports;
    };
    exec("./index.js");
  })()`;
  fs.stat('./dist',(err,data)=>{
      if(err){
          fs.mkdirSync("./dist");
          fs.writeFileSync("./dist/bundle.js", result);
      }else{
          fs.writeFileSync("./dist/bundle.js", result);
      }
  })
}

let modules = createGraph("./index.js");
exec("./index.js");
createBundle(modules);
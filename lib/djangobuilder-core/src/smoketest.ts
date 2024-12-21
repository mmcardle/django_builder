import fs from 'fs';

import Renderer from "./rendering";
import { DjangoVersion } from "./types";
import DjangoProject, {
  DjangoApp, DjangoModel, AuthUser, CharField, BigIntegerField,
  BooleanField, DecimalField, DurationField, EmailField, FileField,
  FloatField, GenericIPAddressField, IntegerField, JSONField,
  PositiveIntegerField, PositiveSmallIntegerField, SlugField, SmallIntegerField,
  IntegerRangeField, TextField, URLField, UUIDField, TimeField, ArrayField,
  ImageField, BigIntegerRangeField, DateTimeRangeField,
  DateRangeField, ForeignKey, OneToOneRelationship, ManyToManyRelationship,
  DateField, DateTimeField, BinaryField,
} from "./api";
//import { exit } from 'process';

//import ModelImporter from "./importer"
// const importer = new ModelImporter();
// const modelsfile = fs.readFileSync("../../ThePetZoo/birds/models.py", "utf-8")
// const modelsDescriptions = importer.import_models([modelsfile.toString()])
// console.log(modelsDescriptions)

const zooProject = new DjangoProject(
  "ThePetZoo",
  "A Project for maintaining Pets",
  DjangoVersion.DJANGO4,
  {
    channels: true,
    htmx: true
  },
  "1234"
);

const mammalsApp: DjangoApp = zooProject.addApp("mammals");
const birdsApp: DjangoApp = zooProject.addApp("birds");

const badgerModel: DjangoModel = mammalsApp.addModel("Badger");

const abstractBlackAndWhiteModel: DjangoModel = birdsApp.addModel("BlackAndWhite", true);
abstractBlackAndWhiteModel.addField("spotted", BooleanField, "max_length=50,default=True");

const flyingCowModel: DjangoModel = birdsApp.addModel("FlyingCow");
flyingCowModel.parents = [abstractBlackAndWhiteModel]

badgerModel.addField("name", CharField, "max_length=50");
badgerModel.setNameField("name");

flyingCowModel.addField("name", CharField, "max_length=50, default='chars'");
flyingCowModel.addField('text', TextField, "default='sometext'")
flyingCowModel.addField('json', JSONField, "default=dict")

flyingCowModel.addField('bigint', BigIntegerField, "default=100")
flyingCowModel.addField('bool', BooleanField, "default=True")
flyingCowModel.addField('decimal', DecimalField, "default=1.5, max_digits=10, decimal_places=2")
flyingCowModel.addField('duration', DurationField, "default=timedelta(days=1)")
flyingCowModel.addField('file', FileField, "upload_to='upload/files/', default='/tmp'")
flyingCowModel.addField('float', FloatField, "default=1.1")
flyingCowModel.addField('integer', IntegerField, "default=-1")
flyingCowModel.addField('positive_integer', PositiveIntegerField, "default=1")
flyingCowModel.addField('positive_small_integer', PositiveSmallIntegerField, "default=1")
flyingCowModel.addField('slug', SlugField, "default='slug', max_length=50")
flyingCowModel.addField('generic_ipaddress', GenericIPAddressField, "default='127.0.0.1'")
flyingCowModel.addField('time', TimeField, "default=time()")
flyingCowModel.addField('small_integer', SmallIntegerField, "default=-1")
flyingCowModel.addField('url', URLField, "default='http://example.com'")
flyingCowModel.addField('uuid', UUIDField, "default=uuid.uuid4")
flyingCowModel.addField('email', EmailField, "default='none@tempurl.com'")
flyingCowModel.addRelationship("owner", ForeignKey, AuthUser, "on_delete=models.CASCADE");
flyingCowModel.addRelationship("parent", ForeignKey, badgerModel, "null=True,on_delete=models.CASCADE,related_name='children'");
flyingCowModel.addRelationship("gaurdian", OneToOneRelationship, badgerModel, "null=True,on_delete=models.CASCADE,related_name='guardians'");
flyingCowModel.addRelationship("siblings", ManyToManyRelationship, badgerModel, "");
flyingCowModel.addField('date', DateField, "auto_now_add=True", false)
flyingCowModel.addField('date_updated', DateField, "auto_now=True", false)
flyingCowModel.addField('datetime', DateTimeField, "auto_now_add=True", false)
flyingCowModel.addField('datetime_updated', DateTimeField, "auto_now=True", false)
flyingCowModel.addField('image', ImageField, "null=True, blank=True")
flyingCowModel.addField('array', ArrayField, "models.CharField(max_length=100), default=list")
flyingCowModel.addField('binary', BinaryField, "", false)

// Imports
//flyingCowModel.addField('GenericForeignKey', 'GenericForeignKey', "")

// Require Postgres extensions
//flyingCowModel.addField('chchar', CICharField, "max_length=100")
//flyingCowModel.addField('ciemail', CIEmailField, "max_length=100")
//flyingCowModel.addField('citext', CITextField, "")
//flyingCowModel.addField('hstore', HStoreField, "")
flyingCowModel.addField('integer_range', IntegerRangeField, "default='[10, 20)'")
flyingCowModel.addField('big_integer_range', BigIntegerRangeField, "default='[0, 1000]'")
flyingCowModel.addField('datetime_range', DateTimeRangeField, "")
flyingCowModel.addField('date_range', DateRangeField, "")

// Need better handling
// flyingCowModel.addField('file_path', FilePathField, "path='/tmp/'")

flyingCowModel.setNameField("name");

const renderer = new Renderer();

console.log(renderer.renderProjectFile("settings.py", zooProject));
console.log(renderer.renderProjectFile("views.py", zooProject));
console.log(renderer.renderProjectFile("wsgi.py", zooProject));
console.log(renderer.renderProjectFile("manage.py", zooProject));
console.log(renderer.renderProjectFile("consumers.py", zooProject));
console.log(renderer.renderProjectFile("requirements.txt", zooProject));
console.log(renderer.renderProjectFile("requirements-dev.txt", zooProject));

console.log(renderer.renderProjectFile("asgi.py", zooProject));
console.log(renderer.renderProjectFile("test_helpers.py", zooProject));
console.log(renderer.renderProjectFile("urls.py", zooProject));

console.log(renderer.renderProjectFile("form.html", zooProject));
console.log(renderer.renderProjectFile("delete_button.html", zooProject));
console.log(renderer.renderProjectFile("create.html", zooProject));
console.log(renderer.renderProjectFile("list.html", zooProject));
console.log(renderer.renderProjectFile("htmx.html", zooProject));
console.log(renderer.renderModelFile("list.html", badgerModel));

console.log(renderer.renderProjectFile("pytest.ini", zooProject));
console.log(renderer.renderProjectFile("test_requirements.txt", zooProject));
console.log(renderer.renderProjectFile("test_settings.py", zooProject));
console.log(renderer.renderProjectFile("test_helpers.py", zooProject));
console.log(renderer.renderProjectFile("__init__.py", zooProject));

console.log(renderer.renderAppFile("htmx.py", mammalsApp));
console.log(renderer.renderAppFile("consumers.py", birdsApp));
console.log(renderer.renderAppFile("views.py", mammalsApp));
console.log(renderer.renderAppFile("api.py", mammalsApp));
console.log(renderer.renderAppFile("serializers.py", mammalsApp));
console.log(renderer.renderAppFile("admin.py", mammalsApp));
console.log(renderer.renderAppFile("models.py", mammalsApp));
console.log(renderer.renderAppFile("urls.py", birdsApp));
console.log(renderer.renderAppFile("models.py", birdsApp));
console.log(renderer.renderAppFile("forms.py", birdsApp));
console.log(renderer.renderAppFile("test_views.py", birdsApp));

const projectTree = renderer.asTree(zooProject);
console.log("ProjectTree", JSON.stringify(projectTree, null, 2))

const tarballContent = renderer.tarballContent(zooProject);
const outputFile = `${zooProject.name}.tar`;

try {
  fs.writeFileSync(outputFile, tarballContent);
  console.log(`File written to ${outputFile}`);
} catch (err) {
  console.error(err);
}
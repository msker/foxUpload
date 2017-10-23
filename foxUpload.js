(function($) {
	var pluginName = 'foxUploader';

	var defaults = {
		url: document.URL,
		method: 'POST',
		extraData: {},
		maxSize: 0,
		maxFiles: 0,
		multiple:true,
		allowedTypes: '*',
		extFilter: '.jpg,.jpeg,.png,.gif',
		dataType: 'json',
		fieldName: 'file',
		
		onInit: function() {},
		onFallbackMode: function(message) {alert(message)},
		onNewFile: function(id, file,totalSize){},
		onStart: function(){},
		onStop: function(){},
		onBeforeUpload: function(id) {},
		onComplete: function() {},
		onUploadProgress: function(id, percent) {},
		onUploadSuccess: function(id, data) {},
		onUploadError: function(id, message) {alert("上传失败："+message)},
		onFileTypeError: function(file) {alert("文件类型有误")},
		onFileSizeError: function(file,maxSize) {alert("文件大小有误，限制"+maxSize)},
		onFileExtError: function(file,ext) {alert("文件扩展名有误，限制"+ext)},
		onFilesMaxError: function(file,maxFiles) {alert("上传文件不能超过"+maxFiles+"个")},
		onRemove: function(file) {},
	};
	var FoxUploader = function(element, options) {
		var self = this;
		
		self.element = $(element);
		self.settings = $.extend({},defaults, options);

		self.checkBrowser = function() {
			if (window.FormData === undefined) {
				self.settings.onFallbackMode.call(self.element, '浏览器不支持表单上传');

				return false;
			}

			if (self.element.find('input[type=file]').length > 0) {
				return true;
			}

			if (!self.checkEvent('drop', self.element) || !self.checkEvent('dragstart', self.element)) {
				self.settings.onFallbackMode.call(self.element, '浏览器不支持拖拽上传');

				return false;
			}

			return true;
		};

		self.checkEvent = function(eventName, element) {
			var element = element || document.createElement('div');
			var eventName = 'on' + eventName;

			var isSupported = eventName in element;

			if (!isSupported) {
				if (!element.setAttribute) {
					element = document.createElement('div');
				}
				if (element.setAttribute && element.removeAttribute) {
					element.setAttribute(eventName, '');
					isSupported = typeof element[eventName] == 'function';

					if (typeof element[eventName] != 'undefined') {
						element[eventName] = undefined;
					}
					element.removeAttribute(eventName);
				}
			}

			element = null;
			return isSupported;
		};
			
		self.humanizeSize=function(size) {
		  var i = Math.floor( Math.log(size) / Math.log(1024) );
		  return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
		}
		

		self.init = function() {

			self.queue = new Array();
			self.queuePos = 0;
			self.queueRunning = false;
			self.queueStop = false;
			self.currentAjax=null;
			
			self.loadedSize=0;
			self.totalSize=0;
			
			self.index = 0;
			
			self.queueCount=0;
			self.thisCount=0;
		
			
			// 拖动上传
			self.element.on('drop',
			function(evt) {
				evt.preventDefault();
				var files = evt.originalEvent.dataTransfer.files;

				self.queueFiles(files);
			});

			//File onChange
			self.element.find('input[type=file]').on('change',
			function(evt) {
				var files = evt.target.files;

				self.queueFiles(files);

				$(this).val('');
			});
			
			//设置文件选择框可选择扩展名
			if(self.settings.extFilter!=null&&self.settings.extFilter!="*"){
				//self.element.find('input[type=file]').attr("accept", self.settings.extFilter)	
			}
			
			//多选
			if(self.settings.multiple==true){
				self.element.find('input[type=file]').attr("multiple", "multiple")	
			}else{
				self.element.find('input[type=file]').removeAttr("multiple")	
			}
			
			//初始化回调
			self.settings.onInit.call(self.element);
		};

		//开始上传
		self.setQueueCount = function(remove) {
			self.queueCount=self.queueCount-remove;
		};

		//开始上传
		self.startUpload = function() {
			self.thisCount=0;
			if (self.queueRunning) {
				return false;
			}

			if (self.queue.length == 0) {
				//return false;
			}
			
			self.settings.onStart.call(self.element);
			self.queueStop=false;
			self.processQueue();
		};
		
		//停止上传
		self.stopUpload = function() {
			if (self.queueRunning) {
				self.queueStop=true;
				self.queueRunning=false;
			}
			
			if(self.currentAjax!=null){
				self.currentAjax.abort();
			}
			self.settings.onStop.call(self.element);
		};

		self.removeQueue = function(id) {
			var file=self.queue[id];
			if(file==undefined){
				return ;	
			}
			delete self.queue[id];
			self.totalSize-=file.size;
			self.settings.onRemove.call(self.element, id,self.totalSize);
		};

		self.queueFiles = function(files) {
			
			// Check max files
			if (self.settings.maxFiles > 0) {
				if (files.length+self.queueCount > self.settings.maxFiles) {
					self.settings.onFilesMaxError.call(self.element, file,self.settings.maxFiles);
					return false;
				}
			}
		
			for (var i = 0; i < files.length; i++) {
				var file = files[i];

				// Check file size
				if ((self.settings.maxSize > 0) && (file.size > self.settings.maxSize)) {

					self.settings.onFileSizeError.call(self.element, file,self.humanizeSize(self.settings.maxSize));

					continue;
				}

				// Check file type
				if ((self.settings.allowedTypes != '*') && !file.type.match(self.settings.allowedTypes)) {

					self.settings.onFileTypeError.call(self.element, file);

					continue;
				}

				// Check file extension
				if (self.settings.extFilter != null&&self.settings.extFilter!="*") {
					var extList = self.settings.extFilter.toLowerCase().split(',');
					var ext = '.'+file.name.toLowerCase().split('.').pop();
					if ($.inArray(ext, extList) < 0) {
						self.settings.onFileExtError.call(self.element, file,self.settings.extFilter);
						continue;
					}
				}
				
				
				self.queue[self.index]=file;
				self.totalSize+=file.size;
				self.queueCount++;
				
				self.settings.onNewFile.call(self.element, self.index, file,self.totalSize,self.queueCount);
				
				self.index++;
			}
			return true;
		};

		self.processQueue = function() {
			
			var self = this;
			
			if(self.queue.length==0){
				self.settings.onComplete.call(self.element,self.thisCount);
				return ;	
			}
			
			for( key in self.queue){
				var file=self.queue[key];
				if(file!=undefined){
					self.queuePos=key;
					delete self.queue[key];
					break;
				}
			}
			if(file==undefined){
				self.queueRunning=false;
				self.settings.onComplete.call(self.element,self.thisCount);
				return ;
			}

			// Form Data
			var fd = new FormData();
			fd.append(self.settings.fieldName, file);
			
		
			// Return from client function (default === undefined)
			var can_continue = self.settings.onBeforeUpload.call(self.element, self.queuePos);

			// If the client function doesn't return FALSE then continue
			if (false === can_continue) {
				return;
			}

			// Append extra Form Data
			
			$.each(self.settings.extraData,
			function(exKey, exVal) {
				fd.append(exKey, exVal);
			});

			
			self.queueRunning = true;

			// Ajax Submit
			self.currentAjax=$.ajax({
				url: self.settings.url,
				type: self.settings.method,
				dataType: self.settings.dataType,
				data: fd,
				cache: false,
				contentType: false,
				processData: false,
				forceSync: false,
				xhr: function() {
					var xhrobj = $.ajaxSettings.xhr();
					if (xhrobj.upload) {
						xhrobj.upload.addEventListener('progress',
						function(event) {
							var percent = 0;
							var position = event.loaded || event.position;
							var total = event.total || e.totalSize;
							if (event.lengthComputable) {
								percent = Math.ceil(position / total * 100);
							}
							
							self.settings.onUploadProgress.call(self.element, self.queuePos, percent);
						},
						false);
					}

					return xhrobj;
				},
				success: function(data, message, xhr) {
					self.thisCount++;
					self.loadedSize+=file.size;
					totalPercent=Math.ceil(self.loadedSize / self.totalSize * 100);
					self.settings.onUploadSuccess.call(self.element, self.queuePos, data,totalPercent,self.loadedSize,self.queuePos);
				},
				error: function(xhr, status, errMsg) {
					self.settings.onUploadError.call(self.element, self.queuePos, errMsg);
				},
				complete: function(xhr, textStatus) {
					if(self.queueStop==false){
						self.processQueue();
					}
				}
			});
			
		}

		if (!self.checkBrowser()) {
			return false;
		}

		self.init();

	};

	$.fn.foxUploader = function(option,value) {
		var method_call;
		var $set = this.each(function() {

			var $this = $(this);
			var data = $this.data(pluginName);
			var options = typeof option === 'object' && option;

			if (!data) $this.data(pluginName, (data = new FoxUploader(this, options)));

			if (typeof option === 'string') {
				if (typeof data[option] === 'function') {
					if(value!== undefined){
						method_call == data[option](value);
					}else{
						method_call == data[option]();
					}
					
				}
			}
		});
		return (method_call === undefined) ? $set: method_call;
	};

	$(document).on('dragenter',
	function(e) {
		e.stopPropagation();
		e.preventDefault();
	});
	$(document).on('dragover',
	function(e) {
		e.stopPropagation();
		e.preventDefault();
	});
	$(document).on('drop',
	function(e) {
		e.stopPropagation();
		e.preventDefault();
	});
})(jQuery);

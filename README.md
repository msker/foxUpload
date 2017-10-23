# foxUpload
一个基于jQuery的上传插件

使用方法：

$(".pic-upload").foxUploader({
			url: 'http://www.abc.com/action/?model=upload&action=upload',//上传请求地址
			multiple:true,//支持多选
			fieldName:'upfile',//上传表单域
      
      //插件初始化
			onInit:function(){
			  this.foxUploader('startUpload');
			},
      
      //上传模式检查结果
			onFallbackMode:function(){
			  this.foxUploader('startUpload');
			},
      
      //选择一个新文件
			onNewFile:function(id, file){
			  this.foxUploader('startUpload');
			},
      
      //移出文件
      onRemove:function(file){
      
      },
     
      //上传之前
      onBeforeUpload: function(){
      
      },
      
      //上传中
      onUploadProgress: function(id, percent){
      
      },
      
      //上传出错
      onUploadError: function(){
        
      },
      
      //文件类型有误
      onFileTypeError: function(file){
      
      },
      
      //文件大小有误
      onFileSizeError: function(file,maxSize){
      
      },
  
      //当前文件上传完成
			onUploadSuccess: function(id, data) {
			  
			},
      
      //文件扩展名有误
      onFileExtError: function(file,ext){
      
      },
      
      //文件数量超限
      onFilesMaxError: function(file,maxFiles){
      
      },
   
      //开始上传
			onStart:function(id, file){
			  btn.setBtn(false,'<i class="fa fa-spinner fa-spin"></i>&nbsp;上传中..')
			},
      
      //上传完成
			onComplete:function(){
			
			}
		});

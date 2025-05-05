<?php
/**
 * 短代码快速插入Live Photos 插件
 * 
 * @package LivePhoto
 * @author 橘夜庭
 * @version 2.0.0
 * @link https://musenxi.com
 */
class LivePhoto_Plugin implements Typecho_Plugin_Interface {

    public static function activate() {
        Typecho_Plugin::factory('Widget_Abstract_Contents')->contentEx = array('LivePhoto_Plugin', 'parse');
        Typecho_Plugin::factory('Widget_Abstract_Contents')->excerptEx = array('LivePhoto_Plugin', 'parse');
        Typecho_Plugin::factory('Widget_Archive')->footer = array('LivePhoto_Plugin', 'footer');
        Typecho_Plugin::factory('admin/write-post.php')->bottom = array('LivePhoto_Plugin', 'addButton');
        Typecho_Plugin::factory('admin/write-page.php')->bottom = array('LivePhoto_Plugin', 'addButton');
        return _t('插件启用成功');
    }

    public static function deactivate() {}
    
    public static function config(Typecho_Widget_Helper_Form $form) {}
    
    public static function personalConfig(Typecho_Widget_Helper_Form $form) {}

    public static function footer() {
        echo "<script type=\"text/javascript\" src=\"https://cdn.apple-livephotoskit.com/lpk/1/livephotoskit.js\"></script>\n";
        $pluginUrl = Helper::options()->pluginUrl;
        echo "<script type=\"text/javascript\" src=\"{$pluginUrl}/LivePhoto/motionphoto.js\"></script>\n";
        echo "<script>console.log('\\n %c LivePhotos v1.0.0 %c https://musenxi.com \\n', 'color: white; background: #ec9bad; padding:5px 0;', 'color: #ec9bad; background: #5698c3; padding:5px 0;');</script>\n";
        echo <<<HTML
        <script>
        function initializeLivePhotos() {
                const livePhotos = document.querySelectorAll('[data-live-photo]');
                if (window.LivePhotosKit) {
                    livePhotos.forEach((livePhoto) => {
                        if (!livePhoto.classList.contains('lpk-live-photo-player')) {
                            LivePhotosKit.augmentElementAsPlayer(livePhoto);
                        }
                    });
                }
            }
        
        // 页面加载完成后初始化 Live Photos
        window.addEventListener('DOMContentLoaded', function() {
            initializeLivePhotos();
        });
        </script>\n
        HTML;
    }

    public static function parse($text, $widget, $lastResult) {
        $text = empty($lastResult) ? $text : $lastResult;
        
        if ($widget instanceof Widget_Archive) {
            $pattern = self::get_shortcode_regex(array('LivePhoto'));
            $text = preg_replace_callback("/$pattern/", array('LivePhoto_Plugin','parseCallback'), $text);
        }
        return $text;
    }

    public static function parseCallback($matches) {
        $attrs = self::shortcode_parse_atts($matches[3]);
        
        // 检查是否为Motion图（只有photo属性，没有video属性）
        if (isset($attrs['photo']) && !isset($attrs['video'])) {
            $ratio = isset($attrs['ratio']) ? $attrs['ratio'] : '4/3';
            
            // 为Motion图生成不同的HTML结构
            return sprintf(
                '<div style="width: auto; aspect-ratio: %s; margin: auto;" id="files">
                    <div><img src="%s" alt="Motion Photo" style="width: 100%%; height: auto;"></div>
                </div>',
                $ratio,
                $attrs['photo']
            );
        }
        // 处理标准Live Photo
        else if (isset($attrs['photo']) && isset($attrs['video'])) {
            $ratio = isset($attrs['ratio']) ? $attrs['ratio'] : '4/3';

            return sprintf(
                '<div style="width: auto; aspect-ratio: %s; margin: auto;" 
                      data-live-photo 
                      data-photo-src="%s" 
                      data-video-src="%s">
                </div>',
                $ratio,
                $attrs['photo'],
                $attrs['video']
            );
        }
        
        return $matches[0];
    }

    public static function addButton() {
        echo <<<HTML
        <script>
        window.addEventListener('load', function() {
            $('#wmd-button-row').append(
                '<li class="wmd-button" id="wmd-livephoto-button" title="插入Live Photo/Motion图">' +
                '<span class="wmd-livephoto-icon">Live</span></li>'
            );
            
            $('#wmd-livephoto-button').click(function() {
                $('body').append(
                    '<div id="LivePhotoPanel">'+
                        '<div class="wmd-prompt-background" style="position: absolute; top: 0px; z-index: 1000; opacity: 0.5; height: 100%; left: 0px; width: 100%;"></div>'+
                        '<div class="wmd-prompt-dialog">'+
                            '<div>'+
                                '<p><b>插入Live Photo/Motion图</b></p>'+
                                '<p>请输入图片URL:</p>'+
                                '<p><input type="text" id="photo-url"></input></p>'+
                                '<p>请输入视频URL (仅Live Photo需要):</p>'+ 
                                '<p><input type="text" id="video-url" placeholder="留空则视为Motion图"></input></p>'+
                                '<p>请输入宽高比(格式如 4/3):</p>'+
                                '<p><input type="text" id="aspect-ratio" placeholder="留空默认为4/3"></input></p>'+
                            '</div>'+
                            '<form>'+
                                '<button type="button" class="btn btn-s primary" id="livephoto-ok">确定</button>'+
                                '<button type="button" class="btn btn-s" id="livephoto-cancel">取消</button>'+
                            '</form>'+
                        '</div>'+
                    '</div>'
                );
            });

            $(document).on('click', '#livephoto-cancel', function() {
                $('#LivePhotoPanel').remove();
                $('textarea').focus();
            });

            $(document).on('click', '#livephoto-ok', function() {
                var photoUrl = $('#photo-url').val();
                var videoUrl = $('#video-url').val();
                var ratio = $('#aspect-ratio').val();
                
                if (photoUrl) {
                    var text = '[LivePhoto photo="' + photoUrl + '"';
                    
                    // 如果提供了视频URL，则添加video属性（Live Photo）
                    if (videoUrl) {
                        text += ' video="' + videoUrl + '"';
                    }
                    
                    // 添加宽高比
                    if(ratio && ratio !== '4/3') {
                        text += ' ratio="' + ratio + '"';
                    }
                    
                    text += ']';
                    var textarea = $('#text');
                    var sel = textarea.getSelection();
                    textarea.replaceSelection(text);
                }
                $('#LivePhotoPanel').remove();
            });
        });
        </script>
        <style>
        .wmd-livephoto-icon {
            display: inline-block;
            color: #999;
            font-size: 12px;
            line-height: 20px;
        }
        </style>
        HTML;
    }
# https://github.com/WordPress/WordPress/blob/master/wp-includes/shortcodes.php#L508
    private static function shortcode_parse_atts($text) {
        $atts = array();
        $pattern = '/([\w-]+)\s*=\s*"([^"]*)"(?:\s|$)|([\w-]+)\s*=\s*\'([^\']*)\'(?:\s|$)|([\w-]+)\s*=\s*([^\s\'"]+)(?:\s|$)|"([^"]*)"(?:\s|$)|(\S+)(?:\s|$)/';
        $text = preg_replace("/[\x{00a0}\x{200b}]+/u", " ", $text);
        
        if (preg_match_all($pattern, $text, $match, PREG_SET_ORDER)) {
            foreach ($match as $m) {
                if (!empty($m[1])) {
                    $atts[strtolower($m[1])] = stripcslashes($m[2]);
                } elseif (!empty($m[3])) {
                    $atts[strtolower($m[3])] = stripcslashes($m[4]); 
                } elseif (!empty($m[5])) {
                    $atts[strtolower($m[5])] = stripcslashes($m[6]);
                }
            }
        }
        return $atts;
    }
# https://github.com/WordPress/WordPress/blob/master/wp-includes/shortcodes.php#L254
    private static function get_shortcode_regex($tagnames = null) {
        $tagregexp = join('|', array_map('preg_quote', $tagnames));
        return '\[(\[?)('.$tagregexp.')(?![\w-])([^\]\/]*(?:\/(?!\])[^\]\/]*)*?)(?:(\/)\]|\](?:([^\[]*+(?:\[(?!\/\2\])[^\[]*+)*+)\[\/\2\])?)(\]?)';
    }
}
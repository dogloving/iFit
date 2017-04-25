import React, { Component } from 'react';
import { TabNavigator } from 'react-navigation';
import {
  AppRegistry,
  View,
  Text,
  Image,
  ListView,
  TouchableOpacity,
  Dimensions,
  WebView
} from 'react-native';
import Header from '../Header.js';
import Navigation from '../../Navigation.js';
import styles from '../FitTime/FitTimeStyles.js';
import Fetch from '../FitTime/FetchData.js';
import RenderView from '../FitTime/RenderView.js'
import LoadingImage from '../../assets/img/loading.gif'

/**
 * 概览
 */
export default class FitTime extends Component {

  static navigationOptions = {
    tabBar: {
      label: 'FitTime',
      icon: ({ tintColor }) => (
        <Image
          source={require('../../assets/img/fittime.png')}
          style={{ height: 18, width: 18 }}
        />
      ),
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
      loaded: false,
    };
    //this.fetchData = this.fetchData.bind(this); 
  }

  componentDidMount() {
    var self = this;
    /**
     * 读取数据
     */
    storage.load({
      key: 'fittime',
      autoSync: true,
    })
      .then(function (ret) {
        //检测缓存，没有缓存则抛出错误，重新加载缓存
        if (typeof ret !== 'array' || ret.length == 0)
          throw new Error("没有数据");
        self.setState({
          dataSource: self.state.dataSource.cloneWithRows(ret),
          loaded: true,
        });
      })
      .catch(function (err) {
        self.fetchData();
      });
  }

  fetchData() {
    var self = this;
    var _datasource = [];
    //获取第一个网站
    fetch('http://www.fitnes.cn/jianshen')
      .then(res => { return res.blob(); })
      .then(blob => {
        var reader = new FileReader();
        reader.readAsText(blob, 'GBK');
        reader.onload = function (e) {
          var $ = cheerio.load(reader.result);
          var allText = $('.inner-wrap').children('a');
          var allPhoto = $('.nodeImg').children('img');
          for (var i = 0; i < allText.length; i++) {
            _datasource.push({
              url: allText[i].attribs.href,
              title: allText[i].attribs.title,
              photo: allPhoto[i].attribs.src
            });
          }

          //获取第二个网站
    fetch('http://www.fitnes.cn/jianshen/index_2.html')
      .then(res => { return res.blob(); })
      .then(blob => {
        var reader = new FileReader();
        reader.readAsText(blob, 'GBK');
        reader.onload = function (e) {
          var $ = cheerio.load(reader.result);
          var allText = $('.inner-wrap').children('a');
          var allPhoto = $('.nodeImg').children('img');
          for (var i = 0; i < allText.length; i++) {
            _datasource.push({
              url: allText[i].attribs.href,
              title: allText[i].attribs.title,
              photo: allPhoto[i].attribs.src
            });
          }

          var realDatasource = [];
          for (var i = 0, j = 0; i < _datasource.length / 4; i++ , j += 4) {
            realDatasource.push([
               _datasource[j],
               _datasource[j + 1],
               _datasource[j + 2],
               _datasource[j + 3],
            ]);
          }
          self.setState({
            dataSource: self.state.dataSource.cloneWithRows(realDatasource),
            loaded: true,
          });

          //讲数据添加进入缓存
          self.saveData();

        }
      })
      .catch((error) => {
        console.warn(error);
      });


        };
      })
      .catch((error) => {
        console.warn(error);

      });
  }

  //加入缓存
  saveData() {
    storage.save({
      key: "fittime",
      rawData: this.state.dataSource,
      expires: 1000 * 60 * 5 //缓存过期时间
    });
  }

  /**
   * 返回网页
   */
  render() {
    var self = this;
    if (!this.state.loaded) {
      return RenderView.renderLoadingView(LoadingImage);
    }
    else return RenderView.renderView('FitTime', self);
  }

  _pressRow(rowData) {
    var theUrl = "http://www.fitnes.cn" + rowData.url;
    Navigation.openWeb({
      title: rowData.title,
      url: theUrl,
      imageUrl: rowData.imageUrl,
    });
  }

  //渲染返回de1listView的每一个
  _renderRow(rowData, sectionID, rowID) {
    var self = this;
    return (
      <View style={styles.ImageTextContainer}>
        <TouchableOpacity
          style={styles.bigContainer}
          onPress={() => self._pressRow({
            url: rowData[0].url,
            title: rowData[0].title,
            imageUrl: rowData[0].photo,
          })}>
          <Image style={styles.BigImage}
            source={{ uri: rowData[0].photo }}>
            <Text style={styles.bigTextView}
              numberOfLines={1}>
              {rowData[0].title}
            </Text>
          </Image>
        </TouchableOpacity>
        <View style={styles.line} />

        {rowData.map(function (ele, i) {
          if (i > 0) {
            return (
              <View key={i} >
                <TouchableOpacity
                  style={styles.smallContainer}
                  onPress={() => self._pressRow({
                    url: ele.url,
                    title: ele.title,
                    imageUrl: ele.photo,
                  })}>
                  <Image style={styles.smallImage}
                    source={{ uri: ele.photo }} />
                  <Text style={styles.smallTextView} >
                    {ele.title}
                  </Text>
                </TouchableOpacity>
                {
                  (i !== 3) ?
                    <View style={styles.line} />
                    :
                    <View />
                }
              </View>
            );
          }
        })}
      </View >
    );
  }
}